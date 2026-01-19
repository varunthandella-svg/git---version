import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Project = {
  name: string;
  description: string;
  tech: string[];
};

/* ---------- SIMPLE PROJECT EXTRACTOR (ROBUST) ---------- */
function extractProjects(resumeText: string): Project[] {
  const projects: Project[] = [];

  const lines = resumeText.split("\n").map(l => l.trim()).filter(Boolean);

  let current: Project | null = null;

  for (const line of lines) {
    // Detect project titles (very common resume pattern)
    if (
      line.length < 60 &&
      /^[A-Z][A-Za-z0-9\s\-:&]+$/.test(line)
    ) {
      if (current) projects.push(current);

      current = {
        name: line,
        description: "",
        tech: [],
      };
      continue;
    }

    if (current) {
      current.description += line + " ";

      const techMatches = line.match(
        /(React|Next\.js|Node\.js|Express|MongoDB|PostgreSQL|MySQL|Python|Django|Flask|Power BI|Tableau|SQL|Excel|AWS|Docker|Kubernetes|Java|Spring|FastAPI)/gi
      );

      if (techMatches) {
        current.tech.push(...techMatches);
      }
    }
  }

  if (current) projects.push(current);

  return projects
    .map(p => ({
      ...p,
      tech: Array.from(new Set(p.tech)),
    }))
    .filter(p => p.tech.length > 0 || p.description.length > 40);
}

/* ---------- API HANDLER ---------- */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resumeText: string = body.resumeText || "";
    const questionIndex: number = body.questionIndex ?? 0;

    if (!resumeText) {
      return NextResponse.json(
        { error: "Resume text missing" },
        { status: 400 }
      );
    }

    const projects = extractProjects(resumeText);

    if (projects.length === 0) {
      return NextResponse.json(
        {
          question:
            "Tell me about a technical project you worked on and the tools you used.",
        },
        { status: 200 }
      );
    }

    /* ----- STRONG, CONSTRAINED PROMPT ----- */
    const prompt = `
You are an interviewer.

Below are projects extracted from a candidate's resume.

${projects
  .map(
    (p, i) => `
Project ${i + 1}:
Name: ${p.name}
Tech: ${p.tech.join(", ")}
Description: ${p.description}
`
  )
  .join("\n")}

RULES (MANDATORY):
- Ask ONLY ONE interview question.
- Question MUST reference a specific project OR its technologies.
- DO NOT ask generic questions.
- DO NOT ask behavioral questions.
- DO NOT repeat previous questions.
- Focus on implementation, decisions, challenges, or architecture.

Question number: ${questionIndex + 1}

Return ONLY the question text. No formatting.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    const question =
      completion.choices[0].message.content?.trim() ||
      "Explain the architecture of one project you worked on.";

    return NextResponse.json({ question });
  } catch (error: any) {
    console.error("ASK QUESTION ERROR:", error.message);

    return NextResponse.json(
      {
        question:
          "Explain the architecture of a project you built and why you chose that approach.",
      },
      { status: 200 }
    );
  }
}
