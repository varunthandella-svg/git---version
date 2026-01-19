import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { resumeText } = await req.json();

    const prompt = `
You are an expert technical interviewer.

From the resume text below, extract ONLY the candidate's PROJECTS.

Rules:
- Ignore education, skills, summary
- Each project must include:
  - name
  - description
  - technologies (array)
- If no projects exist, return empty array
- Output STRICT JSON ONLY (no markdown, no explanation)

Resume:
${resumeText}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const raw = completion.choices[0].message.content || "[]";
    const projects = JSON.parse(raw);

    return NextResponse.json({ projects });
  } catch (err) {
    console.error("EXTRACT PROJECTS ERROR:", err);
    return NextResponse.json({ projects: [] });
  }
}
