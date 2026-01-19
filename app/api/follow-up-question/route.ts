import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      question,
      answer,
      evaluations = [],
      questionIndex = 0,
      maxQuestions = 3,
    } = body;

    // Simple evaluation logic (NO OpenAI)
    let score: "Strong" | "Medium" | "Weak" = "Medium";

    if (answer.length > 120) score = "Strong";
    else if (answer.length < 40) score = "Weak";

    const evaluation = {
      question,
      answer,
      score,
      reasoning:
        score === "Strong"
          ? "Clear explanation with sufficient technical depth."
          : score === "Weak"
          ? "Answer lacked clarity or technical detail."
          : "Answer was partially correct but could be more detailed.",
    };

    const updatedEvaluations = [...evaluations, evaluation];
    const nextIndex = questionIndex + 1;

    return NextResponse.json({
      evaluation,
      evaluations: updatedEvaluations,
      interviewCompleted: nextIndex >= maxQuestions,
      nextQuestionIndex: nextIndex,
    });
  } catch (error: any) {
    console.error("FOLLOW-UP ERROR:", error.message);

    return NextResponse.json(
      {
        evaluation: null,
        interviewCompleted: true,
      },
      { status: 200 }
    );
  }
}
