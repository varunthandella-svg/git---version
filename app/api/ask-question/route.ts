import { NextResponse } from "next/server";
import OpenAI from "openai";
import {
  initSession,
  setQuestions,
  getNextQuestion,
} from "@/app/lib/interviewSession";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    // STEP 1: Extract projects & skills
    const extractPrompt = `
From the resume below:
1. Identify ALL projects (names only)
2. Identify core skills

Return JSON:
{
  "projects": [],
  "skills": []
}

Resume:
${resumeText}
`;

    const extractRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: extractPrompt }],
    });

    const extracted = JSON.parse(
      extractRes.choices[0].message.content || "{}"
    );

    const projects: string[] = extracted.projects || [];
    const skills: string[] = extracted.skills || [];

    // Initialize interview memory
    initSession(projects, skills);

    // STEP 2: Generate QUESTION POOL
    const questionPrompt = `
You are an interviewer.

Based on these projects:
${projects.join(", ")}

And these skills:
${skills.join(", ")}

Generate 6 technical interview questions:
- Project-specific
- NOT generic
- Each question must be unique
- No theory-only questions

Return as JSON array:
["Q1", "Q2", "Q3"]
`;

    const questionRes = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: questionPrompt }],
    });

    const questions: string[] = JSON.parse(
      questionRes.choices[0].message.content || "[]"
    );

    setQuestions(questions);

    const firstQuestion = getNextQuestion();

    return NextResponse.json({
      question: firstQuestion,
    });
  } catch (err) {
    console.error("ask-question error:", err);
    return NextResponse.json(
      { error: "Failed to generate question" },
      { status: 500 }
    );
  }
}
