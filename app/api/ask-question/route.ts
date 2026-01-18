import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resumeText = body.resumeText || "";
    const project = body.project || { name: "Primary Project" };

    const prompt = `
You are an experienced technical interviewer.

Candidate resume:
${resumeText}

Project under discussion:
${project.name}

Rules:
- Ask ONLY one question
- Question must be directly related to this project
- Ask implementation-level or decision-level questions
- Avoid generic questions
- No greetings or explanations

Ask the first interview question now.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [{ role: "user", content: prompt }],
    });

    const question = response.choices[0].message.content?.trim();

    return NextResponse.json({
      question: question || `Explain your role in the ${project.name} project.`,
    });
  } catch (err) {
    return NextResponse.json({
      question: "Explain your project end-to-end and your exact contribution.",
    });
  }
}
