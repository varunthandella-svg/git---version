import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { question, answer } = body;

    if (!answer) {
      return NextResponse.json(
        { error: "Answer missing" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      evaluation: {
        reasoning:
          "Your answer was clear and relevant, but could include more technical depth.",
      },
      nextQuestion: "What challenges did you face in this project?",
    });
  } catch (err) {
    console.error("follow-up error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
