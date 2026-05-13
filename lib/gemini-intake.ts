import { z } from "zod";

import {
  defaultSearchDefaults,
  intakeQuestions,
  searchRequestSchema,
  senioritySchema,
  workModeSchema,
  type GenerateRequest,
  type JobClawResponse,
  type SearchRequest,
} from "@/lib/jobclaw";

const GEMINI_PRIMARY = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_FALLBACK = "gemini-2.5-flash-lite";

const JOBCLAW_GEMINI_SYSTEM = `You are JobClaw, an AI job-search assistant for new graduates.

Read the five intake answers and optional search preferences below. Produce:
1. A short "summary" in FIRST PERSON only ("I am...", "I'm looking for..."). Never third person. 2–4 sentences.
2. A concrete "searchRequest" object for downstream job search tooling (unless answers are essentially empty—in that case set searchRequest to null).

## searchRequest rules
- jobTitle: one realistic primary role title that fits the person's answers (not generic like "professional").
- keywords: 3–5 concise search phrases (skills, domains, responsibilities).
- exclusions: distilled from what they dread in Q4; short phrases without redundant words.
- location: mirror the user's preference when supplied; otherwise infer from intake or use "" if unknown.
- workMode / seniority / minSalary / requireVisaSponsorship / maxResults: align with preferences when explicitly set; otherwise infer conservatively from the narrative.
- provider: default "linkedin". If Prefer Volunteer Roles is true in preferences, use "idealist".

## Output
Return ONLY valid JSON — no markdown, no fences, no commentary:
{
  "summary": "string",
  "searchRequest": {
    "provider": "string",
    "jobTitle": "string",
    "keywords": ["..."],
    "exclusions": ["..."],
    "location": "string",
    "workMode": "Any" | "Remote" | "Hybrid" | "On-site",
    "seniority": "Any" | "Internship" | "Entry level" | "Associate" | "Mid-Senior level" | "Director" | "Executive",
    "minSalary": "string",
    "requireVisaSponsorship": boolean,
    "maxResults": number
  } | null
}`;

const geminiSearchRequestSchema = z.object({
  provider: z.string(),
  jobTitle: z.string(),
  keywords: z.array(z.string()),
  exclusions: z.array(z.string()),
  location: z.string(),
  workMode: workModeSchema,
  seniority: senioritySchema,
  minSalary: z.string(),
  requireVisaSponsorship: z.boolean(),
  maxResults: z.coerce.number().int().min(1).max(50),
});

const geminiJobClawResponseSchema = z.object({
  summary: z.string(),
  searchRequest: geminiSearchRequestSchema.nullable(),
});

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function intakeAnswersComplete(request: GenerateRequest): boolean {
  return intakeQuestions.every(({ id }) => (request.answers[id] ?? "").trim().length > 0);
}

function buildUserContent(request: GenerateRequest): string {
  const d = { ...defaultSearchDefaults, ...request.defaults };
  const { answers } = request;

  return `
Q1 (future day you'd love): ${answers.q1}
Q2 (hidden strengths): ${answers.q2}
Q3 (problems that energize you): ${answers.q3}
Q4 (deal-breakers / dread): ${answers.q4}
Q5 (one-year progress): ${answers.q5}

Search preferences:
- Location: ${d.location.trim() || "Not specified"}
- Work mode: ${d.workMode}
- Seniority: ${d.seniority}
- Minimum salary hint: ${d.minSalary.trim() || "Not specified"}
- Require visa sponsorship: ${d.requireVisaSponsorship}
- Prefer volunteer / nonprofit-heavy roles: ${d.preferVolunteerRoles}
- Max results preference: ${d.maxResults}
- RIASEC or focus override (if any): ${d.riasecOverride.trim() || "None"}
- Extra notes: ${d.notes.trim() || "None"}

Infer the best structured searchRequest for these answers. Respect explicit preferences above when filling searchRequest fields.
`.trim();
}

async function callGeminiModel(model: string, userText: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not set");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: JOBCLAW_GEMINI_SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: userText }] }],
    generationConfig: {
      temperature: 0.65,
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    const err: Error & { status?: number } = new Error(
      `Gemini API error ${response.status}: ${errText.slice(0, 800)}`,
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

function mergeSearchRequestWithUserDefaults(
  base: z.infer<typeof geminiSearchRequestSchema>,
  request: GenerateRequest,
): SearchRequest {
  const d = { ...defaultSearchDefaults, ...request.defaults };

  const location = d.location.trim() ? d.location : base.location;
  const workMode = d.workMode !== "Any" ? d.workMode : base.workMode;
  const seniority = d.seniority !== "Any" ? d.seniority : base.seniority;
  const minSalary = d.minSalary.trim() ? d.minSalary : base.minSalary;

  const merged: SearchRequest = {
    ...base,
    provider: d.preferVolunteerRoles
      ? "idealist"
      : (base.provider || d.provider || "linkedin").trim() || "linkedin",
    location,
    workMode,
    seniority,
    minSalary,
    requireVisaSponsorship: Boolean(d.requireVisaSponsorship || base.requireVisaSponsorship),
    maxResults: Math.min(50, Math.max(1, d.maxResults)),
  };

  return searchRequestSchema.parse(merged);
}

function parseGeminiJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned) as unknown;
}

/**
 * Calls Gemini when GEMINI_API_KEY is set. Returns null if not configured, validation fails, or the API errors (caller should fall back).
 */
export async function generateJobClawWithGemini(
  request: GenerateRequest,
): Promise<JobClawResponse | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  if (!intakeAnswersComplete(request)) {
    return null;
  }

  try {
    const raw = await callGemini(buildUserContent(request));
    const parsed = parseGeminiJson(raw);
    const validated = geminiJobClawResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn("Gemini intake: response failed schema validation", validated.error.flatten());
      return null;
    }

    const { summary, searchRequest: srIn } = validated.data;

    if (!srIn) {
      return { summary, searchRequest: null };
    }

    const searchRequest = mergeSearchRequestWithUserDefaults(srIn, request);
    return { summary, searchRequest };
  } catch (error) {
    console.warn("Gemini intake: call failed, using deterministic fallback", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
