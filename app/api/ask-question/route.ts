import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { resumeText } = body;

    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume text missing" },
        { status: 400 }
      );
    }

    // TEMP STATIC QUESTION (to confirm flow works)
    return NextResponse.json({
      question: "Explain one project you worked on and your role in it.",
    });
  } catch (err) {
    console.error("ask-question error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
