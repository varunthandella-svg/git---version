import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resumeText: string = body.resumeText || "";

    const prompt = `
You are an interviewer.
Read the candidate resume below and ask ONE clear, project-specific technical question.
Do not repeat previous questions.
Focus on implementation details, decisions, challenges, or impact.

RESUME:
${resumeText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.6,
    });

    const question =
      completion.choices[0]?.message?.content?.trim();

    return NextResponse.json({
      question:
        question ||
        "Explain one project you worked on and your exact technical contribution.",
    });
  } catch (error: any) {
    console.error("ASK QUESTION ERROR:", error?.message);

    // 🔒 SAFE FALLBACK (CRITICAL)
    return NextResponse.json({
      question:
        "Explain one project you worked on and the technical challenges you faced.",
    });
  }
}
