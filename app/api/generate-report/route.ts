import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const evaluations = Array.isArray(body.evaluations) ? body.evaluations : [];

  const strengths: string[] = [];
  const gaps: string[] = [];

  evaluations.forEach((e: any) => {
    if (e.answer.length > 100) {
      strengths.push("Clear explanation and sufficient depth in answers.");
    } else {
      gaps.push("Answers lacked depth or concrete implementation details.");
    }
  });

  return NextResponse.json({
    verdict: "Interview Completed",
    summary: "Feedback is based purely on your interview responses.",
    projectBreakdown: {
      strengths: strengths.length ? strengths : ["Good overall understanding."],
      gaps: gaps.length ? gaps : ["Could explain decisions more clearly."],
    },
  });
}
