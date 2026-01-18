import { NextResponse } from "next/server";

function evaluateAnswer(answer: string) {
  const a = (answer || "").trim();

  if (a.length < 15) {
    return {
      score: "Weak" as const,
      reasoning: "Answer is too short. Needs clear explanation of your steps and contribution.",
    };
  }

  if (a.length < 60) {
    return {
      score: "Medium" as const,
      reasoning: "Answer has some clarity but lacks depth, examples, and technical specifics.",
    };
  }

  return {
    score: "Strong" as const,
    reasoning: "Answer is detailed with clear reasoning, flow, and project ownership signals.",
  };
}

function nextProjectQuestion(projectName: string, asked: string[]) {
  const pool = [
    `In "${projectName}", explain your data cleaning / preprocessing steps clearly.`,
    `In "${projectName}", what were the key metrics / KPIs and why?`,
    `In "${projectName}", describe your architecture / approach in a structured way.`,
    `In "${projectName}", explain one optimization you did (time, memory, queries, performance).`,
  ];

  for (const q of pool) {
    if (!asked.includes(q)) return q;
  }
  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const question = body.question || "";
    const answer = body.answer || "";
    const askedQuestions: string[] = body.askedQuestions || [];
    const project = body.project || { name: "Primary Project" };

    const questionCountForProject = Number(body.questionCountForProject || 0);
    const maxQuestionsPerProject = Number(body.maxQuestionsPerProject || 2);

    const evaluation = evaluateAnswer(answer);

    // If we still need more questions for this project -> return nextQuestion
    const nextNeeded = questionCountForProject + 1 < maxQuestionsPerProject;

    if (nextNeeded) {
      const q = nextProjectQuestion(project.name, askedQuestions);
      return NextResponse.json({
        evaluation,
        nextQuestion: q || "",
      });
    }

    // project finished -> return empty nextQuestion so client moves to next project
    return NextResponse.json({
      evaluation,
      nextQuestion: "",
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "follow-up-question failed", details: String(e?.message || e) },
      { status: 500 }
    );
  }
}
