import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    if (!resumeText || resumeText.length < 50) {
      return NextResponse.json(
        { error: "Invalid resume text" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      questions: [
        "Explain one project you worked on and your exact contribution.",
        "What was the biggest technical challenge in this project?",
        "If given more time, how would you improve this project?",
      ],
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    );
  }
}
