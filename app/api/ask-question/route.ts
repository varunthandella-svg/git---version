export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  const { resumeText } = await req.json();

  if (!resumeText) {
    return NextResponse.json(
      { error: "resumeText missing" },
      { status: 400 }
    );
  }

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: `
You are a technical interviewer.

From the resume below:
Ask ONE deep project-based interview question.
Return ONLY the question.

Resume:
${resumeText}
`,
      },
    ],
    temperature: 0.4,
  });

  return NextResponse.json({
    question: response.choices[0].message.content,
  });
}
