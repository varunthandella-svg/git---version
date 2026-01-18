import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { evaluations } = body;

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { error: "No evaluations found" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verdict: "Medium",
      summary:
        "The candidate demonstrated basic understanding but lacked depth in explanations.",
      strengths: [
        "Clear communication",
        "Relevant project exposure",
      ],
      improvementAreas: [
        "Technical depth",
        "Problem-solving articulation",
      ],
    });
  } catch (err) {
    console.error("generate-report error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
