import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      resumeText,
      project,
      questionIndex,
      totalQuestions,
      previousAnswer,
    } = body;

    const prompt = `
You are a senior technical interviewer.

Candidate resume:
${resumeText}

Project context:
${project?.name || "Project from resume"}

The candidate already answered previous questions.

This is question ${questionIndex + 1} out of ${totalQuestions}.

Ask ONE new interview question:
- Related to the project OR skills
- NOT generic
- NOT repeating earlier questions
- Can be architecture, logic, edge cases, decisions, tradeoffs

Only return the question text.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return NextResponse.json({
      question: completion.choices[0].message.content,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
