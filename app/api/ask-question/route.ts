import { NextResponse } from "next/server";

function pickQuestion(projectName: string, tech: string[], asked: string[]) {
  const t = (tech || []).slice(0, 6).join(", ");

  const pool = [
    `In your project "${projectName}", what problem were you solving and who was the end user?`,
    `Explain the dataset / inputs you used in "${projectName}". How did you clean or validate them?`,
    `Walk me through the end-to-end flow of "${projectName}" from input to output.`,
    `What were your exact contributions in "${projectName}"? What did you build yourself?`,
    `What was the hardest bug or issue in "${projectName}" and how did you fix it?`,
    `How did you measure success in "${projectName}" (accuracy, KPIs, performance, speed)?`,
    t
      ? `In "${projectName}", where exactly did you use ${t}? Explain one concrete example.`
      : `In "${projectName}", explain one technical decision you made and why.`,
  ];

  for (const q of pool) {
    if (!asked.includes(q)) return q;
  }
  return `In "${projectName}", explain one improvement you would do if you had 1 more week.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const project = body.project || { name: "Primary Project", tech: [] };
    const askedQuestions: string[] = body.askedQuestions || [];

    const projectName = project?.name || "Primary Project";
    const tech = Array.isArray(project?.tech) ? project.tech : [];

    const question = pickQuestion(projectName, tech, askedQuestions);

    return NextResponse.json({ question });
  } catch (e: any) {
    return NextResponse.json(
      { error: "ask-question failed", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
