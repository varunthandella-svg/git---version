import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { resumeText, question, answer } = body;

    const prompt = `
You are an interviewer evaluating a candidate.

Resume context:
${resumeText}

Previous question:
${question}

Candidate answer:
${answer}

Tasks:
1. Briefly evaluate the answer (Strong / Medium / Weak)
2. Give a 1–2 line reasoning
3. Decide if a follow-up question is needed
4. If needed, ask ONE deeper follow-up question
5. If not needed, return "NEXT_QUESTION"

Respond strictly in JSON:
{
  "score": "Strong | Medium | Weak",
  "reasoning": "...",
  "nextQuestion": "..."
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.5,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);

    return NextResponse.json({
      evaluation: {
        score: parsed.score,
        reasoning: parsed.reasoning,
      },
      nextQuestion:
        parsed.nextQuestion === "NEXT_QUESTION"
          ? ""
          : parsed.nextQuestion,
    });
  } catch (err) {
    return NextResponse.json({
      evaluation: {
        score: "Medium",
        reasoning: "Answer was partially correct but lacked depth.",
      },
      nextQuestion: "",
    });
  }
}
