import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const evaluations = Array.isArray(body.evaluations)
      ? body.evaluations
      : [];

    if (evaluations.length === 0) {
      return NextResponse.json({
        overallSummary: "Interview completed.",
        strengths: [],
        improvements: [],
      });
    }

    const prompt = `
You are an interview evaluator.

Below are interview Q&A interactions:

${evaluations
  .map(
    (e: any, i: number) =>
      `Q${i + 1}: ${e.question}\nA${i + 1}: ${e.answer}`
  )
  .join("\n\n")}

Based ONLY on these answers:
1. Write a short overall summary (2–3 lines)
2. List strengths (bullet points)
3. List improvement areas (bullet points)

Return JSON ONLY:
{
  "overallSummary": "text",
  "strengths": ["point1", "point2"],
  "improvements": ["point1", "point2"]
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const content = completion.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty OpenAI response");

    const parsed = JSON.parse(content);

    return NextResponse.json({
      overallSummary: parsed.overallSummary || "",
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
    });
  } catch (err) {
    console.error("GENERATE REPORT ERROR:", err);

    // 🛡️ NEVER CRASH UI
    return NextResponse.json({
      overallSummary:
        "Interview completed. Report could not be fully generated.",
      strengths: [],
      improvements: [],
    });
  }
}
