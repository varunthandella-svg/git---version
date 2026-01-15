import { NextResponse } from "next/server";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { resumeText, evaluations } = await req.json();

    const prompt = `
You are a hiring manager.

Based on the interview evaluations below, generate a final interview report.

EVALUATIONS:
${JSON.stringify(evaluations, null, 2)}

TASK:
1. Give final verdict: Hire / Borderline / No-Hire
2. Give a concise summary (3–4 lines)
3. Provide project-wise strengths & gaps

Respond ONLY in valid JSON:

{
  "verdict": "Hire | Borderline | No-Hire",
  "summary": "text",
  "projectBreakdown": {
    "strengths": ["..."],
    "gaps": ["..."]
  }
}
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a hiring manager." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content || "{}";
    return NextResponse.json(JSON.parse(raw));
  } catch (error) {
    console.error("REPORT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
