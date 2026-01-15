export const runtime = "nodejs";

import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { project } = await req.json();

    if (!project) {
      return NextResponse.json(
        { error: "project missing" },
        { status: 400 }
      );
    }

    const prompt = `
You are a technical interviewer.

Ask ONE clear interview question based on this project.

Project:
Name: ${project.name}
Description: ${project.description}
Tech: ${project.tech?.join(", ")}

Rules:
- Ask only ONE question
- It must test real understanding
- Do NOT provide hints
- Do NOT include answers
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const question = response.choices[0].message.content;

    return NextResponse.json({ question });
  } catch (err: any) {
    return NextResponse.json(
      { error: "question generation failed", details: err.message },
      { status: 500 }
    );
  }
}
