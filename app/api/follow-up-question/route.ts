import { NextResponse } from "next/server";
import { getNextQuestion } from "@/app/lib/interviewQuestions";

export async function POST() {
  const next = getNextQuestion();

  if (!next) {
    return NextResponse.json({
      nextQuestion: null,
      interviewCompleted: true,
    });
  }

  return NextResponse.json({
    nextQuestion: next,
    interviewCompleted: false,
  });
}
