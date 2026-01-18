import { NextResponse } from "next/server";

type Evaluation = {
  question: string;
  answer: string;
  score: "Strong" | "Medium" | "Weak";
  reasoning: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const evaluations: Evaluation[] = Array.isArray(body.evaluations)
      ? body.evaluations
      : [];

    // ❌ SCORING REMOVED (as per your requirement)
    // We will generate report purely from interaction quality

    const strengths: string[] = [];
    const improvements: string[] = [];

    evaluations.forEach((e: Evaluation) => {
      if (e.score === "Strong") {
        strengths.push(e.reasoning);
      } else if (e.score === "Weak") {
        improvements.push(e.reasoning);
      }
    });

    return NextResponse.json({
      verdict:
        improvements.length === 0
          ? "Strong"
          : improvements.length <= 2
          ? "Medium"
          : "Weak",

      summary:
        "This report is generated based on your interview responses and interaction quality.",

      projectBreakdown: {
        strengths,
        gaps: improvements,
      },
    });
  } catch (err) {
    console.error("generate-report error:", err);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
