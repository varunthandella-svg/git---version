import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

    // Defensive fallback
    if (evaluations.length === 0) {
      return NextResponse.json({
        verdict: "Weak",
        summary: "No valid responses were recorded during the interview.",
        projectBreakdown: {
          strengths: [],
          gaps: ["No evaluable answers submitted"],
        },
      });
    }

    const strong = evaluations.filter(
      (e: Evaluation) => e.score === "Strong"
    ).length;

    const medium = evaluations.filter(
      (e: Evaluation) => e.score === "Medium"
    ).length;

    const weak = evaluations.filter(
      (e: Evaluation) => e.score === "Weak"
    ).length;

    // Verdict logic (simple & reliable)
    let verdict: "Strong" | "Medium" | "Weak" = "Weak";

    if (strong >= medium && strong >= weak) verdict = "Strong";
    else if (medium >= strong && medium >= weak) verdict = "Medium";

    // IMPORTANT: strengths & gaps MUST come from interview answers,
    // NOT resume (as per your requirement)
    const strengths = evaluations
      .filter((e) => e.score === "Strong")
      .map((e) => e.reasoning);

    const gaps = evaluations
      .filter((e) => e.score === "Weak")
      .map((e) => e.reasoning);

    return NextResponse.json({
      verdict,
      summary:
        "The evaluation is based entirely on the candidate’s spoken responses and interaction quality during the interview.",
      projectBreakdown: {
        strengths,
        gaps,
      },
    });
  } catch (error) {
    console.error("Generate report error:", error);

    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
