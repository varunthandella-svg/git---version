import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { resumeText, evaluations } = await req.json();

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json(
        { error: "No evaluations found" },
        { status: 400 }
      );
    }

    const evaluationText = evaluations
      .map(
        (e: any, i: number) =>
          `Q${i + 1}: ${e.question}\nAnswer: ${e.answer}\nScore: ${e.score}\nReason: ${e.reasoning}`
      )
      .join("\n\n");

    const prompt = `
You are an interview evaluator.

Based on the candidate resume and interview evaluations, generate a final report.

Resume:
${resumeText}

Interview Evaluations:
${evaluationText}

Return JSON only with this structure:
{
  "verdict": "Strong | Medium | Weak",
  "summary": "2-3 line overall feedback",
  "projectBreakdown": {
    "strengths": ["..."],
    "gaps": ["..."]
  }
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content || "{}";
    const json = JSON.parse(text);

    return NextResponse.json(json);
  } catch (err: any) {
    console.error("REPORT ERROR:", err);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
