import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const evaluations = Array.isArray(body.evaluations) ? body.evaluations : [];

    const strong = evaluations.filter((e) => e.score === "Strong").length;
    const medium = evaluations.filter((e) => e.score === "Medium").length;
    const weak = evaluations.filter((e) => e.score === "Weak").length;

    let verdict: "Strong" | "Medium" | "Weak" = "Medium";
    if (weak >= 2) verdict = "Weak";
    else if (strong >= 2 && weak === 0) verdict = "Strong";

    // Strengths / gaps based on observed evaluations
    const strengths: string[] = [];
    const gaps: string[] = [];

    if (strong > 0) strengths.push("Good clarity and ownership in explaining work and contribution.");
    if (medium > 0) strengths.push("Some structure present; communicates reasonably under time.");
    if (weak === 0) strengths.push("No major breakdowns; maintained continuity across questions.");

    if (weak > 0) gaps.push("Needs more depth: technical specifics, examples, and step-by-step explanation.");
    if (medium + weak > strong) gaps.push("Improve structured storytelling: problem → approach → output → impact.");
    if (weak >= 2) gaps.push("Answer completeness and confidence under time needs improvement.");

    const summary =
      verdict === "Strong"
        ? "Candidate demonstrated strong project ownership and clear, detailed explanations across most questions."
        : verdict === "Weak"
        ? "Candidate struggled to give complete, structured, and detailed answers under timed conditions."
        : "Candidate showed moderate clarity but needs stronger depth and structured explanation in answers.";

    return NextResponse.json({
      verdict,
      summary,
      projectBreakdown: {
        strengths,
        gaps,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "generate-report failed", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
