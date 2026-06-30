import { z } from "zod";

import type { VettingResult } from "@/lib/cc-agent-flow";
import type { ProjectSprintSlug } from "@/lib/ai-tracks-data";
import { parseGeminiJson } from "@/lib/gemini-json";
import { coerceGapParameters, type ProfileGapParameter } from "@/lib/profile-gaps";
import {
  getSprintRoadmapBySlug,
  type RoadmapDayNode,
  type SprintRoadmapData,
} from "@/lib/sprint-roadmap-data";

const GEMINI_PRIMARY = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_FALLBACK = "gemini-2.5-flash-lite";

export type IntakeRoadmapWeek = {
  week: number;
  title: string;
  bullets: string[];
  focusGap?: string;
};

export type IntakePersonalizedRoadmap = {
  roleLabel: string;
  sprintSlug: ProjectSprintSlug | null;
  promise: string;
  weeks: IntakeRoadmapWeek[];
  generatedAt: string;
};

const roadmapWeekSchema = z.object({
  week: z.number().int().min(1).max(6),
  title: z.string().min(1).max(120),
  bullets: z.array(z.string().min(1).max(280)).min(2).max(4),
  focusGap: z.string().max(80).optional(),
});

const roadmapResponseSchema = z.object({
  weeks: z.array(roadmapWeekSchema).length(6),
});

const ROADMAP_SYSTEM = `You are dear[CC], building a personalized 6-week career sprint roadmap for a new graduate.

You receive:
- Their target role and gap analysis (what's missing vs. what the job requires)
- A sprint template with weekly themes and deliverables

Return JSON only with this shape:
{
  "weeks": [
    { "week": 1, "title": "...", "bullets": ["...", "..."], "focusGap": "optional facet name" }
  ]
}

Rules:
- Exactly 6 weeks (week numbers 1 through 6).
- Keep each week title short (under 12 words).
- 2–4 bullets per week; each bullet is concrete and actionable.
- Personalize bullets to close their specific gaps — reference skills, tools, or experiences they lack.
- Use the template week themes as structure; do not invent a totally different program.
- Week 6 should culminate in shareable proof-of-work for applications.
- focusGap should name which gap facet that week primarily addresses when relevant.`;

export function roleIdToSprintSlug(roleId: string): ProjectSprintSlug {
  switch (roleId) {
    case "sales":
      return "sales";
    case "marketing":
      return "marketing";
    case "fde":
      return "forward-deployed-engineer";
    case "swe":
    case "long-tail":
    default:
      return "marketing";
  }
}

function nodeToBullets(node: RoadmapDayNode): string[] {
  const bullets = [`${node.theme}: ${node.deliverable}`];
  if (node.tools.length > 0) {
    bullets.push(`Tools: ${node.tools.slice(0, 4).join(", ")}`);
  }
  return bullets;
}

function pickNodes(nodes: RoadmapDayNode[], indices: number[]): RoadmapDayNode[] {
  return indices.map((index) => nodes[Math.min(index, nodes.length - 1)]!);
}

export function buildTemplateWeeksFromSprint(roadmap: SprintRoadmapData): IntakeRoadmapWeek[] {
  const firstHalf = roadmap.week1;
  const secondHalf = roadmap.week2;
  const picks = [
    ...pickNodes(firstHalf, [0, 1, 2]),
    ...pickNodes(secondHalf, [0, Math.floor(secondHalf.length / 2), secondHalf.length - 1]),
  ];

  return picks.map((node, index) => ({
    week: index + 1,
    title: node.theme,
    bullets: nodeToBullets(node),
  }));
}

export function buildTemplateRoadmap(input: {
  vetting: VettingResult;
  sprintSlug: ProjectSprintSlug;
}): IntakePersonalizedRoadmap {
  const sprint = getSprintRoadmapBySlug(input.sprintSlug);
  const fallback = getSprintRoadmapBySlug("marketing")!;

  const template = sprint ?? fallback;
  return {
    roleLabel: input.vetting.inferredRoleLabel,
    sprintSlug: template.slug as ProjectSprintSlug,
    promise: template.promise,
    weeks: buildTemplateWeeksFromSprint(template),
    generatedAt: new Date().toISOString(),
  };
}

function gapSummaryForPrompt(parameters: ProfileGapParameter[]): string {
  return coerceGapParameters(parameters)
    .map((row) => {
      const keywords = row.keywords.join(", ");
      return `- ${row.parameter} (${row.status}): job needs "${row.jobRequires}"; you have "${row.youHave}"; keywords: ${keywords}`;
    })
    .join("\n");
}

function templateSummaryForPrompt(weeks: IntakeRoadmapWeek[]): string {
  return weeks
    .map((week) => `Week ${week.week}: ${week.title}\n  ${week.bullets.join("\n  ")}`)
    .join("\n");
}

async function callGeminiModel(model: string, userText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: ROADMAP_SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    const err: Error & { status?: number } = new Error(
      `Gemini API error ${response.status}: ${errText.slice(0, 500)}`,
    );
    err.status = response.status;
    throw err;
  }

  const payload = (await response.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) {
    throw new Error("Gemini returned empty content");
  }
  return text;
}

async function callGemini(userText: string): Promise<string> {
  try {
    return await callGeminiModel(GEMINI_PRIMARY, userText);
  } catch (err) {
    const status = (err as { status?: number }).status;
    if (status === 429 || status === 503) {
      return await callGeminiModel(GEMINI_FALLBACK, userText);
    }
    throw err;
  }
}

export type BuildIntakeRoadmapInput = {
  vetting: VettingResult;
  targetJobUrl?: string;
  linkedInUrl?: string;
  resumeText?: string;
};

export async function buildPersonalizedIntakeRoadmap(
  input: BuildIntakeRoadmapInput,
): Promise<IntakePersonalizedRoadmap> {
  const sprintSlug = roleIdToSprintSlug(input.vetting.inferredRoleId);
  const template = buildTemplateRoadmap({ vetting: input.vetting, sprintSlug });

  const personalized = await personalizeRoadmapWithGemini({
    vetting: input.vetting,
    targetJobUrl: input.targetJobUrl ?? "",
    template,
  });

  return personalized ?? template;
}

async function personalizeRoadmapWithGemini(input: {
  vetting: VettingResult;
  targetJobUrl: string;
  template: IntakePersonalizedRoadmap;
}): Promise<IntakePersonalizedRoadmap | null> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return null;
  }

  const gaps = input.vetting.gapParameters ?? [];
  const userPrompt = `
Target role: ${input.vetting.inferredRoleLabel} (${input.vetting.inferredRoleId})
Target job URL: ${input.targetJobUrl.trim() || "not provided"}
Sprint promise: ${input.template.promise}

Gap analysis:
${gapSummaryForPrompt(gaps)}

Template roadmap skeleton:
${templateSummaryForPrompt(input.template.weeks)}

Personalize the 6-week roadmap bullets to close this candidate's gaps while keeping the sprint structure.
`;

  try {
    const raw = await callGemini(userPrompt);
    const parsed = parseGeminiJson(raw);
    const validated = roadmapResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn("Intake roadmap: Gemini schema validation failed", validated.error.flatten());
      return null;
    }

    const weeks = validated.data.weeks
      .slice()
      .sort((a, b) => a.week - b.week)
      .map((week) => ({
        week: week.week,
        title: week.title.trim(),
        bullets: week.bullets.map((bullet) => bullet.trim()),
        focusGap: week.focusGap?.trim() || undefined,
      }));

    return {
      ...input.template,
      weeks,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.warn("Intake roadmap: Gemini call failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
