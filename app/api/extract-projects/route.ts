import { NextResponse } from "next/server";

/**
 * Very safe project extractor.
 * Never throws.
 * Never returns 400.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const resumeText: string = body?.resumeText || "";

    if (!resumeText || resumeText.trim().length < 50) {
      // Fallback – resume too short or missing
      return NextResponse.json({
        projects: [{ name: "Primary Project" }],
      });
    }

    const text = resumeText.toLowerCase();

    const projects: { name: string; tech?: string[] }[] = [];

    // -------- HEURISTIC 1: "Project:" / "Projects" sections
    const projectMatches = resumeText.match(
      /(project[s]?:|academic project[s]?:)([\s\S]{0,1200})/i
    );

    if (projectMatches) {
      const block = projectMatches[2];

      const lines = block
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      for (const line of lines) {
        // Stop if we hit Experience / Skills etc.
        if (
          /experience|education|skills|certification|internship/i.test(line)
        ) {
          break;
        }

        // Likely project title line
        if (
          line.length > 5 &&
          line.length < 80 &&
          !line.includes(":") &&
          !line.includes("•")
        ) {
          projects.push({ name: line });
        }
      }
    }

    // -------- HEURISTIC 2: Bullet-style projects
    const bulletProjects = resumeText.match(
      /•\s*(.+project.+)/gi
    );
    if (bulletProjects) {
      bulletProjects.forEach((p) => {
        const cleaned = p.replace("•", "").trim();
        if (cleaned.length < 80) {
          projects.push({ name: cleaned });
        }
      });
    }

    // -------- Deduplicate
    const unique = new Map<string, any>();
    for (const p of projects) {
      unique.set(p.name.toLowerCase(), p);
    }

    const finalProjects =
      unique.size > 0
        ? Array.from(unique.values()).slice(0, 3)
        : [{ name: "Primary Project" }];

    return NextResponse.json({
      projects: finalProjects,
    });
  } catch (err) {
    // ABSOLUTE SAFETY FALLBACK
    return NextResponse.json({
      projects: [{ name: "Primary Project" }],
    });
  }
}
