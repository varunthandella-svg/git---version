import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resumeText = body?.resumeText;

    if (!resumeText || typeof resumeText !== "string" || resumeText.length < 50) {
      return NextResponse.json(
        { error: "Invalid or empty resumeText" },
        { status: 400 }
      );
    }

    // TEMP SAFE QUESTION (until OpenAI is re-enabled)
    return NextResponse.json({
      question:
        "Explain one project you worked on recently and your exact contribution.",
    });
  } catch (err) {
    console.error("ask-question error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
