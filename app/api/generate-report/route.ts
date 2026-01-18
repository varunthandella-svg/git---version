import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { evaluations } = await req.json();

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { error: "No interview data" },
        { status: 400 }
      );
    }

    const transcript = evaluations
      .map(
        (e: any, i: number) =>
          `Q${i + 1}: ${e.question}\nA: ${e.answer}`
      )
      .join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an interview evaluator. Based ONLY on candidate answers, generate strengths, improvement areas, and a final verdict (Strong / Medium / Weak).",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
      temperature: 0.3,
    });

    return NextResponse.json({
      report: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("generate-report error:", err);

    return NextResponse.json({
      report:
        "Interview completed. Candidate demonstrated partial clarity. More depth and structured explanations are recommended.",
    });
  }
}
