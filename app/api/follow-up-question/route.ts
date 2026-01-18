import { NextResponse } from "next/server";
import { getNextInterviewQuestion } from "@/app/lib/interviewSession";

export async function POST() {
  const nextQuestion = getNextInterviewQuestion();

  return NextResponse.json({
    evaluation: {
      reasoning: "Answer recorded for final report.",
    },
    nextQuestion,
  });
}
