import { NextResponse } from "next/server";

let cachedQuestions: string[] = [];
let index = 0;

export async function POST(req: Request) {
  const body = await req.json();

  // First question call (generate once)
  if (cachedQuestions.length === 0) {
    const aiRes = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-questions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText: body.resumeText }),
      }
    );

    const aiData = await aiRes.json();
    cachedQuestions = aiData.questions || [];
    index = 0;
  }

  // Safety fallback
  if (cachedQuestions.length === 0) {
    return NextResponse.json({
      question: "Explain one project you worked on and your contribution.",
    });
  }

  const question = cachedQuestions[index] || null;
  index++;

  return NextResponse.json({ question });
}
