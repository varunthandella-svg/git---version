import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();
  const resumeText = body.resumeText || "";

  // SIMPLE & STABLE heuristic (no AI yet)
  const projects = [];

  const lines = resumeText.split("\n");
  for (const line of lines) {
    if (
      line.toLowerCase().includes("project") ||
      line.toLowerCase().includes("dashboard") ||
      line.toLowerCase().includes("analysis")
    ) {
      projects.push({ name: line.trim() });
    }
  }

  // Fallback
  if (projects.length === 0) {
    projects.push({ name: "Primary Resume Project" });
  }

  return NextResponse.json({ projects });
}
