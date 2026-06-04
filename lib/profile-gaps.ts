import { z } from "zod";

import type { VettingResult } from "@/lib/cc-agent-flow";
import type { IntakeAnswers } from "@/lib/jobclaw";
import type { ParsedProfileInsight } from "@/lib/profile-parse";

const GEMINI_PRIMARY = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_FALLBACK = "gemini-2.5-flash-lite";

export const GAP_STATUSES = ["missing", "good", "stretch"] as const;
export type GapParameterStatus = (typeof GAP_STATUSES)[number];

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
  parameters: z.array(gapParameterSchema).min(5).max(10),
  summary: z.string().max(400).optional(),
});

export type ProfileGapAssessment = z.infer<typeof gapAssessmentSchema>;

const PROFILE_GAPS_SYSTEM = `You are dear[CC], vetting a new graduate's profile against their target role.

Score each parameter for job-readiness using exactly one status:
- "missing" — not evidenced or far below bar for the target role
- "good" — clearly demonstrated on résumé/LinkedIn/quiz context
- "stretch" — partial signal; worth strengthening before applying

Evaluate 6–8 parameters. Always include these when relevant:
1. Target role alignment
2. Education & credentials
3. Quantified impact (metrics, outcomes)
4. Relevant experience (internships, projects, work)
5. Skills & tools (include AI-native / automation fluency when relevant)
6. Portfolio / proof of work
7. Profile completeness (LinkedIn + résumé)
8. Career narrative clarity

Be specific in notes (what you saw or what's absent). Second person ("you"). Lowercase tone, concise.

Return ONLY valid JSON:
{
  "parameters": [
    { "parameter": "string (short label)", "status": "missing" | "good" | "stretch", "note": "string" }
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

Score each parameter missing / good / stretch for this candidate vs the target role.
`.trim();
}

export function buildGapParametersFallback(input: ProfileGapInput): ProfileGapParameter[] {
  const { vetting } = input;
  const hasResume = Boolean(input.resumeText.trim() || input.linkedInUrl.trim());
  const hasTarget = input.knowsTargetJob && Boolean(input.targetJobUrl.trim());

  const rows: ProfileGapParameter[] = [
    {
      parameter: "Target role alignment",
      status: vetting.roleVetted ? "good" : "stretch",
      note: vetting.roleVetted
        ? `you map to our ${vetting.inferredRoleLabel} track.`
        : "your target may sit outside our core vetted tracks — we'll tailor a plan.",
    },
    {
      parameter: "Quantified impact",
      status: vetting.quantitativeSignal ? "good" : "missing",
      note: vetting.quantitativeSignal
        ? "résumé shows metrics, outcomes, or leadership signals."
        : "add numbers, scope, or results to internships and projects.",
    },
    {
      parameter: "Education & credentials",
      status: vetting.quantitativeSignal ? "stretch" : "missing",
      note: vetting.quantitativeSignal
        ? "education is present — make GPA, coursework, or honors explicit if you have them."
        : "surface school, degree, and relevant coursework on your résumé.",
    },
    {
      parameter: "Relevant experience",
      status: vetting.profileStrength === "strong" ? "good" : "stretch",
      note:
        vetting.profileStrength === "strong"
          ? "experience lines up with an entry-level target role."
          : "build 1–2 projects or internships that mirror the role you want.",
    },
    {
      parameter: "AI-native skills",
      status: "stretch",
      note: "show tools you use (LLMs, automation, data) in project bullets — core to dear[CC] sprints.",
    },
    {
      parameter: "Profile completeness",
      status: hasResume ? "good" : "missing",
      note: hasResume
        ? "we have linkedin or résumé text to work from."
        : "add a linkedin url or upload a résumé.",
    },
    {
      parameter: "Target job clarity",
      status: hasTarget ? "good" : "stretch",
      note: hasTarget
        ? "you named a concrete target job."
        : "a specific posting or title helps us calibrate gaps.",
    },
  ];

  return rows;
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

    return validated.data;
  } catch (error) {
    console.warn("Profile gaps: Gemini call failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function analyzeProfileGaps(input: ProfileGapInput): Promise<ProfileGapParameter[]> {
  const fromGemini = await analyzeProfileGapsWithGemini(input);
  if (fromGemini?.parameters?.length) {
    return fromGemini.parameters;
  }
  return buildGapParametersFallback(input);
}

export function gapStatusLabel(status: GapParameterStatus): string {
  return status;
}
