import { NextResponse } from "next/server";
import { getNextQuestion } from "@/app/lib/interviewQuestions";

export async function POST() {
  try {
    const nextQuestion = getNextQuestion();

    if (!nextQuestion) {
      return NextResponse.json({
        nextQuestion: null,
        interviewCompleted: true,
      });
    }

    return NextResponse.json({
      nextQuestion,
      interviewCompleted: false,
    });
  } catch (error) {
    console.error("FOLLOW-UP ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch next question" },
      { status: 500 }
    );
  }
}
