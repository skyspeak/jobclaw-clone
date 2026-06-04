import { z } from "zod";

import type { VettingResult } from "@/lib/cc-agent-flow";
import type { IntakeAnswers } from "@/lib/jobclaw";
import type { ParsedProfileInsight } from "@/lib/profile-parse";

const GEMINI_PRIMARY = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_FALLBACK = "gemini-2.5-flash-lite";

export const GAP_STATUSES = ["missing", "good", "stretch"] as const;
export type GapParameterStatus = (typeof GAP_STATUSES)[number];

export const GAP_FACETS = [
  "Domain expertise",
  "Skills",
  "Leadership experience",
] as const;

export type GapFacet = (typeof GAP_FACETS)[number];

export type ProfileGapParameter = {
  parameter: string;
  status: GapParameterStatus;
  note: string;
};

const gapParameterSchema = z.object({
  parameter: z.string().min(1).max(80),
  status: z.enum(GAP_STATUSES),
  note: z.string().min(1).max(280),
});

const gapAssessmentSchema = z.object({
  parameters: z.array(gapParameterSchema).length(3),
  summary: z.string().max(400).optional(),
});

export type ProfileGapAssessment = z.infer<typeof gapAssessmentSchema>;

const PROFILE_GAPS_SYSTEM = `You are dear[CC], vetting a new graduate's profile against their target role.

Score exactly THREE facets — no more, no fewer — using exactly one status each:
- "missing" — not evidenced or far below bar for the target role
- "good" — clearly demonstrated on résumé/LinkedIn/quiz context
- "stretch" — partial signal; worth strengthening before applying

The three facets (use these exact parameter labels):

1. "Domain expertise" — years of relevant experience and industry/domain exposure for the target role (internships, projects, and adjacent industries count; estimate tenure when possible).

2. "Skills" — quantifiable, learnable skills and tools (technical, analytical, AI-native, software, methods). Name specific tools or skills in the note when possible.

3. "Leadership experience" — taking initiative, ownership, and leading without relying on management titles or headcount. Examples: founding projects, captaining teams, driving outcomes, organizing others.

Do NOT score management titles or team size alone as leadership. Do NOT add extra parameters.

Be specific in notes (what you saw or what's absent). Second person ("you"). Lowercase tone, concise.

Return ONLY valid JSON:
{
  "parameters": [
    { "parameter": "Domain expertise", "status": "missing" | "good" | "stretch", "note": "string" },
    { "parameter": "Skills", "status": "missing" | "good" | "stretch", "note": "string" },
    { "parameter": "Leadership experience", "status": "missing" | "good" | "stretch", "note": "string" }
  ],
  "summary": "optional one sentence overall"
}`;

export type ProfileGapInput = {
  knowsTargetJob: boolean;
  targetJobUrl: string;
  linkedInUrl: string;
  resumeText: string;
  resumeFileName?: string;
  answers: IntakeAnswers;
  profileInsight: ParsedProfileInsight | null;
  vetting: VettingResult;
};

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
      systemInstruction: { parts: [{ text: PROFILE_GAPS_SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature: 0.35,
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

  const json = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text?.trim()) {
    throw new Error("Gemini returned no text content");
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

function parseGeminiJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned) as unknown;
}

function buildUserPrompt(input: ProfileGapInput): string {
  const resume = (input.resumeText ?? "").trim().slice(0, 12000);
  const target = input.targetJobUrl.trim() || input.vetting.inferredRoleLabel;
  const { answers } = input;

  return `
Target role / job: ${target}
Knows specific dream job URL: ${input.knowsTargetJob}
Inferred track: ${input.vetting.inferredRoleLabel} (${input.vetting.inferredRoleId})
Vetting flags: quantitativeSignal=${input.vetting.quantitativeSignal}, roleVetted=${input.vetting.roleVetted}, profileStrength=${input.vetting.profileStrength}

LinkedIn URL: ${input.linkedInUrl.trim() || "not provided"}
Résumé file: ${input.resumeFileName?.trim() || "not uploaded"}
Résumé text:
${resume || "not provided"}

Profile parse hints:
- first-time seeker: ${input.profileInsight?.isLikelyFirstTimeJobSeeker ?? "unknown"}
- suggested roles: ${(input.profileInsight?.suggestedRoles ?? []).join(", ") || "none"}
- filters intro: ${input.profileInsight?.filtersIntro ?? ""}

Quiz answers:
- Q1: ${answers.q1}
- Q2: ${answers.q2}
- Q3: ${answers.q3}
- Q4: ${answers.q4}
- Q5: ${answers.q5}

Score all three facets (Domain expertise, Skills, Leadership experience) as missing / good / stretch for this candidate vs the target role.
`.trim();
}

function normalizeFacetLabel(label: string): GapFacet | null {
  const normalized = label.trim().toLowerCase();
  if (normalized.includes("domain")) {
    return "Domain expertise";
  }
  if (normalized === "skills" || normalized.includes("skill")) {
    return "Skills";
  }
  if (normalized.includes("leadership")) {
    return "Leadership experience";
  }
  return null;
}

function normalizeGapParameters(parameters: ProfileGapParameter[]): ProfileGapParameter[] {
  const byFacet = new Map<GapFacet, ProfileGapParameter>();

  for (const row of parameters) {
    const facet = normalizeFacetLabel(row.parameter);
    if (facet && !byFacet.has(facet)) {
      byFacet.set(facet, { ...row, parameter: facet });
    }
  }

  return GAP_FACETS.map((facet) => byFacet.get(facet)).filter(Boolean) as ProfileGapParameter[];
}

export function buildGapParametersFallback(input: ProfileGapInput): ProfileGapParameter[] {
  const { vetting } = input;
  const hasResume = Boolean(input.resumeText.trim() || input.linkedInUrl.trim());
  const corpus = [input.resumeText, input.answers.q2, input.answers.q5].join(" ").toLowerCase();
  const leadershipSignals = /\b(founder|president|captain|lead|organized|initiated|led|chair|head)\b/.test(
    corpus,
  );

  return [
    {
      parameter: "Domain expertise",
      status: vetting.roleVetted && vetting.profileStrength === "strong" ? "good" : "stretch",
      note: vetting.roleVetted
        ? hasResume
          ? "some industry or role-adjacent experience is visible — spell out years and domain on your résumé."
          : "add résumé detail on years in target industry or adjacent roles."
        : "target domain is unclear or thin — internships and projects in the target industry will help.",
    },
    {
      parameter: "Skills",
      status: vetting.quantitativeSignal ? "good" : "missing",
      note: vetting.quantitativeSignal
        ? "résumé names learnable skills or tools — keep listing specifics (software, methods, AI tools)."
        : "name quantifiable skills and tools you can learn and prove (e.g. python, sql, figma, llm workflows).",
    },
    {
      parameter: "Leadership experience",
      status: leadershipSignals ? "stretch" : "missing",
      note: leadershipSignals
        ? "initiative shows up — highlight what you drove, not just titles or team size."
        : "add examples where you took initiative (projects you started, groups you led, outcomes you owned).",
    },
  ];
}

export async function analyzeProfileGapsWithGemini(
  input: ProfileGapInput,
): Promise<ProfileGapAssessment | null> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return null;
  }

  if (!input.resumeText.trim() && !input.linkedInUrl.trim()) {
    return null;
  }

  try {
    const raw = await callGemini(buildUserPrompt(input));
    const parsed = parseGeminiJson(raw);
    const validated = gapAssessmentSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn("Profile gaps: Gemini schema validation failed", validated.error.flatten());
      return null;
    }

    const normalized = normalizeGapParameters(validated.data.parameters);
    if (normalized.length !== GAP_FACETS.length) {
      console.warn("Profile gaps: expected 3 facets after normalization", normalized.length);
      return null;
    }

    return { ...validated.data, parameters: normalized };
  } catch (error) {
    console.warn("Profile gaps: Gemini call failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function analyzeProfileGaps(input: ProfileGapInput): Promise<ProfileGapParameter[]> {
  const fromGemini = await analyzeProfileGapsWithGemini(input);
  if (fromGemini?.parameters?.length === GAP_FACETS.length) {
    return fromGemini.parameters;
  }
  return buildGapParametersFallback(input);
}

export function gapStatusLabel(status: GapParameterStatus): string {
  return status;
}
