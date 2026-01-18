import { NextResponse } from "next/server";
import { setQuestions, getNextQuestion } from "@/app/lib/interviewQuestions";
import { client } from "@/app/lib/openaiClient";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resumeText = body?.resumeText;

    if (!resumeText || resumeText.trim().length < 20) {
      return NextResponse.json(
        { error: "Resume text missing or too short" },
        { status: 400 }
      );
    }

    // 🔒 SAFETY: Generate questions ONLY ONCE
    const prompt = `
You are a senior technical interviewer.

TASK:
- Read the resume
- Identify ALL projects
- If only 1 project → create EXACTLY 3 questions
- If more than 1 project → create EXACTLY 5 questions total
- Questions MUST be:
  • Project-specific
  • Implementation-focused
  • Skill-based
- DO NOT ask generic questions
- Return ONLY a JSON array of strings

RESUME:
${resumeText}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      throw new Error("Empty OpenAI response");
    }

    let questions: string[];

    try {
      questions = JSON.parse(raw);
    } catch {
      throw new Error("OpenAI did not return valid JSON array");
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Questions array invalid");
    }

    // ✅ Store questions in memory
    setQuestions(questions);

    // ✅ Return first question
    return NextResponse.json({
      question: getNextQuestion(),
    });
  } catch (error: any) {
    console.error("ASK QUESTION ERROR:", error);

    return NextResponse.json(
      { error: "Error starting interview" },
      { status: 500 }
    );
  }
}
