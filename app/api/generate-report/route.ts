import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { evaluations } = await req.json();

    if (!evaluations || evaluations.length === 0) {
      return NextResponse.json({
        verdict: "Weak",
        summary: "Insufficient interview data to evaluate performance.",
        projectBreakdown: {
          strengths: [],
          gaps: [],
        },
      });
    }

    const prompt = `
You are an interviewer evaluating a PROJECT VIVA strictly based on spoken answers.

CRITICAL RULES (DO NOT BREAK):
- Do NOT use resume information.
- Do NOT use numeric scoring.
- Do NOT calculate averages, percentages, or totals.
- Do NOT mention marks or scores.
- Base everything ONLY on what the candidate actually spoke.

Evaluate the candidate on:
- Concept clarity
- Depth of explanation
- Technical correctness
- Confidence and articulation
- Ability to justify decisions

Below are the interview interactions:

${evaluations
  .map(
    (e: any, i: number) => `
Question ${i + 1}: ${e.question}
Candidate Answer: ${e.answer}
Evaluator Notes: ${e.reasoning}
`
  )
  .join("\n")}

Now generate a FINAL INTERVIEW REPORT in JSON ONLY with this exact structure:

{
  "verdict": "Strong | Medium | Weak",
  "summary": "2–3 lines summarizing overall interview performance based ONLY on answers",
  "projectBreakdown": {
    "strengths": [
      "Strengths clearly demonstrated in spoken answers"
    ],
    "gaps": [
      "Weaknesses or missing understanding observed in answers"
    ]
  }
}

Verdict guidelines:
- Strong → Clear, confident, technically sound answers with depth
- Medium → Partial understanding, correct basics, limited depth
- Weak → Confusion, shallow explanations, or incorrect reasoning

Be honest, specific, and answer-driven.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const text = completion.choices[0].message.content || "{}";
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");

    const report = JSON.parse(text.slice(jsonStart, jsonEnd + 1));

    return NextResponse.json(report);
  } catch (error) {
    console.error("Generate report error:", error);

    return NextResponse.json(
      {
        verdict: "Weak",
        summary: "An error occurred while generating the report.",
        projectBreakdown: {
          strengths: [],
          gaps: [],
        },
      },
      { status: 500 }
    );
  }
}
