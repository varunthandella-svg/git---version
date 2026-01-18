import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume missing" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an interviewer conducting a project viva. Ask ONE clear project-based question.",
        },
        {
          role: "user",
          content: resumeText,
        },
      ],
      temperature: 0.4,
    });

    return NextResponse.json({
      question: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("ask-question OpenAI error:", err);

    // SAFE FALLBACK
    return NextResponse.json({
      question:
        "Explain one project you worked on and your exact contribution.",
    });
  }
}
