import { NextResponse } from "next/server";
import { setQuestions, getNextQuestion } from "@/app/lib/interviewQuestions";
import { client } from "@/app/lib/openaiClient";

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume text missing" },
        { status: 400 }
      );
    }

    const prompt = `
You are a technical interviewer.

TASK:
1. Read the resume
2. Identify ALL projects
3. If only 1 project → create exactly 3 questions
4. If more than 1 project → create exactly 5 questions total
5. Questions must be:
   - Project specific
   - Implementation focused
   - Skill based
6. Do NOT include generic questions
7. Return ONLY a JSON array of strings

Resume:
${resumeText}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const raw = response.choices[0].message.content || "[]";
    const questions = JSON.parse(raw);

    if (!Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: "Invalid questions generated" },
        { status: 500 }
      );
    }

    setQuestions(questions);

    return NextResponse.json({
      question: getNextQuestion(),
    });
  } catch (error) {
    console.error("ASK QUESTION ERROR:", error);
    return NextResponse.json(
      { error: "Error starting interview" },
      { status: 500 }
    );
  }
}
