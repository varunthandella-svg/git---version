import { NextResponse } from "next/server";
import {
  initInterviewSession,
  setInterviewQuestions,
  getNextInterviewQuestion,
} from "@/app/lib/interviewSession";

export async function POST(req: Request) {
  const body = await req.json();
  const projects = body.projects;

  if (!projects || projects.length === 0) {
    return NextResponse.json(
      { error: "No projects found" },
      { status: 400 }
    );
  }

  // 1️⃣ Initialize session
  initInterviewSession(projects);

  // 2️⃣ Create deterministic project-based questions
  const questions: string[] = [];

  projects.forEach((project: any) => {
    questions.push(
      `Explain the project "${project.name}" and your exact contribution.`
    );
    questions.push(
      `What technical challenges did you face in "${project.name}" and how did you solve them?`
    );
    questions.push(
      `If you had to improve "${project.name}" today, what would you change and why?`
    );
  });

  // 3️⃣ Store questions
  setInterviewQuestions(questions);

  // 4️⃣ Ask first question
  const firstQuestion = getNextInterviewQuestion();

  return NextResponse.json({
    question: firstQuestion,
  });
}
