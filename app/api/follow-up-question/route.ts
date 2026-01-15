import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { resumeText, question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing question or answer" },
        { status: 400 }
      );
    }

    const prompt = `
You are a strict technical interviewer.

QUESTION:
${question}

ANSWER:
${answer}

TASK:
1. Score the answer as one of: Strong, Medium, Weak
2. Give a 1–2 line reasoning
3. Ask a follow-up question ONLY if needed (vague / partial answer)
4. If no follow-up needed, return null

Respond ONLY in valid JSON:

{
  "evaluation": {
    "score": "Strong | Medium | Weak",
    "reasoning": "short explanation"
  },
  "nextQuestion": "follow-up question OR null"
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a technical interviewer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("FOLLOW-UP ERROR:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
