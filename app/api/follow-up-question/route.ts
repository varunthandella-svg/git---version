import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getNextQuestion } from "@/app/lib/interviewSession";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { question, answer } = await req.json();

    const evalPrompt = `
Evaluate the candidate answer.

Question:
${question}

Answer:
${answer}

Return JSON:
{
  "score": "Strong | Medium | Weak",
  "reasoning": "short explanation"
}
`;

    const evalRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: evalPrompt }],
    });

    const evaluation = JSON.parse(
      evalRes.choices[0].message.content || "{}"
    );

    const nextQuestion = getNextQuestion();

    return NextResponse.json({
      evaluation,
      nextQuestion,
    });
  } catch (err) {
    console.error("follow-up error:", err);
    return NextResponse.json(
      { error: "Failed follow-up" },
      { status: 500 }
    );
  }
}
