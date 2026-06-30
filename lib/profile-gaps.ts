import { z } from "zod";

import { parseGeminiJson } from "@/lib/gemini-json";

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
  jobRequires: string;
  youHave: string;
  status: GapParameterStatus;
  /** Exactly three short labels surfaced from the profile — strengths or gaps. */
  keywords: string[];
};

export const gapParameterSchema = z.object({
  parameter: z.string().min(1).max(80),
  jobRequires: z.string().min(1).max(280),
  youHave: z.string().min(1).max(280),
  status: z.enum(GAP_STATUSES),
  keywords: z.array(z.string().min(1).max(48)).length(3),
});

const gapAssessmentSchema = z.object({
  parameters: z.array(gapParameterSchema).length(3),
  summary: z.string().max(400).optional(),
});

export type ProfileGapAssessment = z.infer<typeof gapAssessmentSchema>;

const PROFILE_GAPS_SYSTEM = `You are dear[CC], vetting a new graduate's profile against their target role.

For exactly THREE facets, compare what the job requires vs what the candidate has. Use these exact facet labels:

1. "Domain expertise" — years of relevant experience and industry/domain exposure (internships, projects, adjacent industries count).

2. "Skills" — quantifiable, learnable skills and tools (technical, analytical, AI-native, software, methods).

3. "Leadership experience" — initiative and ownership, NOT management titles or headcount alone.

For each facet return:
- jobRequires: what a competitive candidate for this target role typically needs (specific, concise)
- youHave: what this candidate actually shows on résumé/LinkedIn/quiz (specific; say "not evidenced" if absent)
- status (verdict): exactly one of "missing" | "good" | "stretch"
  - missing — not evidenced or far below bar
  - good — clearly demonstrated
  - stretch — partial signal; worth strengthening
- keywords: exactly 3 short phrases (1–4 words each) naming what you actually found for this facet — strengths OR gaps (e.g. "B2B SaaS", "no SQL named", "club president"). Concrete; no filler.

Second person in youHave ("you"). Lowercase tone. No extra facets.

Return ONLY valid JSON:
{
  "parameters": [
    {
      "parameter": "Domain expertise",
      "jobRequires": "string",
      "youHave": "string",
      "status": "missing" | "good" | "stretch",
      "keywords": ["string", "string", "string"]
    },
    {
      "parameter": "Skills",
      "jobRequires": "string",
      "youHave": "string",
      "status": "missing" | "good" | "stretch",
      "keywords": ["string", "string", "string"]
    },
    {
      "parameter": "Leadership experience",
      "jobRequires": "string",
      "youHave": "string",
      "status": "missing" | "good" | "stretch",
      "keywords": ["string", "string", "string"]
    }
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

function buildUserPrompt(input: ProfileGapInput): string {
  const resume = (input.resumeText ?? "").trim().slice(0, 12000);
  const target = input.targetJobUrl.trim() || input.vetting.inferredRoleLabel;
  const { answers } = input;

  return `
Target role / job: ${target}
Has target job listing URL: ${input.knowsTargetJob}
Inferred track: ${input.vetting.inferredRoleLabel} (${input.vetting.inferredRoleId})
Vetting flags: quantitativeSignal=${input.vetting.quantitativeSignal}, roleVetted=${input.vetting.roleVetted}, profileStrength=${input.vetting.profileStrength}

LinkedIn URL: ${input.linkedInUrl.trim() || "not provided"}
Résumé file: ${input.resumeFileName?.trim() || "not uploaded"}
Résumé text:
${resume || "not provided"}

Profile parse hints:
- first-time seeker: ${input.profileInsight?.isLikelyFirstTimeJobSeeker ?? "unknown"}
- suggested roles: ${(input.profileInsight?.suggestedRoles ?? []).join(", ") || "none"}

Quiz answers:
- Q1: ${answers.q1}
- Q2: ${answers.q2}
- Q3: ${answers.q3}
- Q4: ${answers.q4}
- Q5: ${answers.q5}

Fill jobRequires, youHave, status, and keywords (3 each) for Domain expertise, Skills, and Leadership experience.
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

function defaultKeywordsForFacet(facet: GapFacet, status: GapParameterStatus): string[] {
  if (facet === "Domain expertise") {
    if (status === "good") return ["role-adjacent work", "industry exposure", "relevant projects"];
    if (status === "stretch") return ["adjacent experience", "limited tenure", "needs depth"];
    return ["no domain match", "missing internships", "unclear industry"];
  }
  if (facet === "Skills") {
    if (status === "good") return ["named tools", "quantified outcomes", "technical depth"];
    if (status === "stretch") return ["some tools listed", "thin evidence", "needs specificity"];
    return ["no tools named", "generic bullets", "missing methods"];
  }
  if (status === "good") return ["owned outcomes", "initiative shown", "peer leadership"];
  if (status === "stretch") return ["some initiative", "weak outcomes", "needs examples"];
  return ["no ownership", "no initiatives", "coursework only"];
}

function ensureGapKeywords(row: ProfileGapParameter): string[] {
  const facet = normalizeFacetLabel(row.parameter);
  const cleaned = (row.keywords ?? []).map((k) => k.trim()).filter(Boolean).slice(0, 3);
  while (cleaned.length < 3) {
    const defaults = defaultKeywordsForFacet(facet ?? "Skills", row.status);
    cleaned.push(defaults[cleaned.length] ?? "not assessed");
  }
  return cleaned;
}

function normalizeGapParameters(parameters: ProfileGapParameter[]): ProfileGapParameter[] {
  const byFacet = new Map<GapFacet, ProfileGapParameter>();

  for (const row of parameters) {
    const facet = normalizeFacetLabel(row.parameter);
    if (facet && !byFacet.has(facet)) {
      const normalized: ProfileGapParameter = {
        ...row,
        parameter: facet,
        keywords: ensureGapKeywords({ ...row, parameter: facet }),
      };
      byFacet.set(facet, normalized);
    }
  }

  return GAP_FACETS.map((facet) => byFacet.get(facet)).filter(Boolean) as ProfileGapParameter[];
}

export function buildGapParametersFallback(input: ProfileGapInput): ProfileGapParameter[] {
  const { vetting } = input;
  const target = input.targetJobUrl.trim() || vetting.inferredRoleLabel;
  const hasResume = Boolean(input.resumeText.trim() || input.linkedInUrl.trim());
  const corpus = [input.resumeText, input.answers.q2, input.answers.q5].join(" ").toLowerCase();
  const leadershipSignals = /\b(founder|president|captain|lead|organized|initiated|led|chair|head)\b/.test(
    corpus,
  );

  return [
    {
      parameter: "Domain expertise",
      jobRequires: `1–2 years in ${target} or an adjacent industry`,
      youHave: hasResume
        ? vetting.roleVetted
          ? "some role-adjacent experience on your résumé — years in domain not always clear"
          : "limited clear domain match for this target role"
        : "not evidenced — no résumé or linkedin detail",
      status: vetting.roleVetted && vetting.profileStrength === "strong" ? "good" : "stretch",
      keywords: vetting.roleVetted
        ? ["role-adjacent work", "résumé signals", "domain unclear"]
        : ["limited domain match", "no clear industry", "needs experience"],
    },
    {
      parameter: "Skills",
      jobRequires: "named, learnable tools and methods typical for the role (incl. AI-native workflows)",
      youHave: vetting.quantitativeSignal
        ? "some skills and tools listed on your résumé"
        : "few or no specific skills/tools named",
      status: vetting.quantitativeSignal ? "good" : "missing",
      keywords: vetting.quantitativeSignal
        ? ["tools named", "quant signals", "learnable stack"]
        : ["no tools named", "generic skills", "missing methods"],
    },
    {
      parameter: "Leadership experience",
      jobRequires: "examples of initiative — projects started, outcomes owned, peers organized",
      youHave: leadershipSignals
        ? "some initiative signals (lead, founder, captain, etc.) — strengthen with outcomes"
        : "not evidenced beyond coursework",
      status: leadershipSignals ? "stretch" : "missing",
      keywords: leadershipSignals
        ? ["initiative verbs", "ownership hints", "needs outcomes"]
        : ["no leadership", "no initiatives", "coursework only"],
    },
  ];
}

/** Migrate legacy rows that only had a single note field. */
export function coerceGapParameters(rows: ProfileGapParameter[]): ProfileGapParameter[] {
  return rows.map((row) => {
    const legacy = row as ProfileGapParameter & { note?: string };
    const base: ProfileGapParameter = legacy.jobRequires && legacy.youHave
      ? row
      : {
          parameter: row.parameter,
          jobRequires: legacy.jobRequires ?? "typical bar for your target role",
          youHave: legacy.note ?? legacy.youHave ?? "not assessed",
          status: row.status,
          keywords: legacy.keywords ?? [],
        };

    return {
      ...base,
      keywords: ensureGapKeywords(base),
    };
  });
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

export type GapSkillBar = {
  label: string;
  score: number;
  tier: "Strong" | "Solid" | "Gap" | "Stretch";
  keywords: string[];
};

function scoreForGapStatus(status: GapParameterStatus, label: string): number {
  const seed = label.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  if (status === "good") return 72 + (seed % 17);
  if (status === "stretch") return 38 + (seed % 10);
  return 18 + (seed % 12);
}

function tierForGapStatus(status: GapParameterStatus, score: number): GapSkillBar["tier"] {
  if (status === "good") return score >= 80 ? "Strong" : "Solid";
  if (status === "stretch") return "Stretch";
  return "Gap";
}

/** Split facet rows into strength vs gap progress bars for the intake UI. */
export function splitGapParametersToBars(parameters: ProfileGapParameter[]): {
  strengths: GapSkillBar[];
  gaps: GapSkillBar[];
} {
  const rows = coerceGapParameters(parameters);
  const strengths: GapSkillBar[] = [];
  const gaps: GapSkillBar[] = [];

  for (const row of rows) {
    const score = scoreForGapStatus(row.status, row.parameter);
    const item: GapSkillBar = {
      label: row.parameter,
      score,
      tier: tierForGapStatus(row.status, score),
      keywords: ensureGapKeywords(row),
    };
    if (row.status === "good") {
      strengths.push(item);
    } else {
      gaps.push(item);
    }
  }

  return { strengths, gaps };
}
