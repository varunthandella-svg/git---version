import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, answer } = body;

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Question or answer missing" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an interview evaluator. Evaluate the candidate's answer strictly based on clarity, correctness, and depth. Do NOT generate a new question.",
        },
        {
          role: "user",
          content: `Question: ${question}\nAnswer: ${answer}`,
        },
      ],
      temperature: 0.2,
    });

    const feedback = completion.choices[0].message.content || "";

    return NextResponse.json({
      evaluation: {
        feedback,
      },
    });
  } catch (error) {
    console.error("FOLLOW-UP QUESTION ERROR:", error);
    return NextResponse.json(
      { error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
