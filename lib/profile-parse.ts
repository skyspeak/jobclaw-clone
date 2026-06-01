import { z } from "zod";

import { senioritySchema, workModeSchema, type Seniority, type WorkMode } from "@/lib/jobclaw";

const GEMINI_PRIMARY = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_FALLBACK = "gemini-2.5-flash-lite";

const PROFILE_PARSE_SYSTEM = `You analyze a job seeker's LinkedIn URL and/or résumé text (plus optional intake quiz answers) to suggest search filters.

Return ONLY valid JSON — no markdown, no commentary:
{
  "isLikelyFirstTimeJobSeeker": boolean,
  "isLikelyLongTermUnemployed": boolean,
  "suggestedSeniority": "Any" | "Internship" | "Entry level" | "Associate" | "Mid-Senior level" | "Director" | "Executive",
  "suggestedWorkMode": "Any" | "Remote" | "Hybrid" | "On-site",
  "suggestedLocation": "string (city/region or empty)",
  "suggestedRoles": ["3-5 realistic job titles"],
  "filtersIntro": "1-2 sentences in second person explaining what you inferred and how filters were tailored (e.g. 'Based on your résumé, you look early-career in operations. I pre-filled entry-level filters and example roles below.')"
}`;

export type ParsedProfileInsight = {
  isLikelyFirstTimeJobSeeker: boolean;
  isLikelyLongTermUnemployed: boolean;
  suggestedSeniority: Seniority;
  suggestedWorkMode: WorkMode;
  suggestedLocation: string;
  suggestedRoles: string[];
  filtersIntro: string;
};

export type ProfileParseInput = {
  linkedInUrl?: string;
  resumeText?: string;
  resumeFileName?: string;
  answers?: {
    q1?: string;
    q2?: string;
    q3?: string;
    q4?: string;
    q5?: string;
  };
};

const parsedProfileSchema = z.object({
  isLikelyFirstTimeJobSeeker: z.boolean(),
  isLikelyLongTermUnemployed: z.boolean(),
  suggestedSeniority: senioritySchema,
  suggestedWorkMode: workModeSchema,
  suggestedLocation: z.string(),
  suggestedRoles: z.array(z.string()).min(1).max(6),
  filtersIntro: z.string(),
});

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
      systemInstruction: { parts: [{ text: PROFILE_PARSE_SYSTEM }] },
      contents: [{ role: "user", parts: [{ text: userText }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 2048,
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

function buildUserPrompt(input: ProfileParseInput): string {
  const resume = (input.resumeText ?? "").trim().slice(0, 12000);
  const linkedIn = (input.linkedInUrl ?? "").trim();
  const answers = input.answers ?? {};

  return `
LinkedIn URL: ${linkedIn || "Not provided"}
Résumé file: ${input.resumeFileName?.trim() || "Not uploaded"}
Résumé text:
${resume || "Not provided"}

Intake quiz (optional context):
- Q1: ${answers.q1 ?? ""}
- Q2: ${answers.q2 ?? ""}
- Q3: ${answers.q3 ?? ""}
- Q4: ${answers.q4 ?? ""}
- Q5: ${answers.q5 ?? ""}

Infer seniority, example roles, location, and work mode. Write filtersIntro for the next step ("Almost there — any search filters?").
`.trim();
}

function parseGeminiJson(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned) as unknown;
}

export function parseProfileFallback(input: ProfileParseInput): ParsedProfileInsight {
  const text = [input.linkedInUrl, input.resumeText].join(" ").toLowerCase();

  const firstTimeSignals = [
    "first job",
    "new grad",
    "recent graduate",
    "entry level",
    "internship",
    "student",
  ];
  const unemploymentSignals = ["unemployed", "laid off", "career break", "seeking opportunities"];

  const isLikelyFirstTimeJobSeeker = firstTimeSignals.some((s) => text.includes(s));
  const isLikelyLongTermUnemployed = unemploymentSignals.some((s) => text.includes(s));

  let suggestedSeniority: Seniority = "Any";
  if (isLikelyFirstTimeJobSeeker) {
    suggestedSeniority = "Entry level";
  } else if (text.includes("director") || text.includes("head of")) {
    suggestedSeniority = "Director";
  } else if (text.includes("manager") || text.includes("lead")) {
    suggestedSeniority = "Mid-Senior level";
  } else if (text.includes("associate") || text.includes("coordinator")) {
    suggestedSeniority = "Associate";
  }

  const roleRules: Array<{ terms: string[]; role: string }> = [
    { terms: ["operations", "process"], role: "Operations Coordinator" },
    { terms: ["customer", "support"], role: "Customer Success Associate" },
    { terms: ["program", "community"], role: "Program Coordinator" },
    { terms: ["data", "analytics"], role: "Data Analyst" },
    { terms: ["marketing", "content"], role: "Marketing Coordinator" },
  ];

  const suggestedRoles = roleRules
    .filter(({ terms }) => terms.some((term) => text.includes(term)))
    .map(({ role }) => role)
    .slice(0, 4);

  if (suggestedRoles.length === 0) {
    suggestedRoles.push("Operations Coordinator", "Customer Success Associate", "Program Assistant");
  }

  const filtersIntro = isLikelyFirstTimeJobSeeker
    ? "Based on your background, you look early-career. I suggested entry-level filters and example roles below — adjust anything that doesn't fit."
    : "Based on your LinkedIn or résumé, I suggested seniority and example roles below — skip anything that doesn't matter.";

  return {
    isLikelyFirstTimeJobSeeker,
    isLikelyLongTermUnemployed,
    suggestedSeniority,
    suggestedWorkMode: "Any",
    suggestedLocation: "",
    suggestedRoles,
    filtersIntro,
  };
}

export async function parseProfileWithGemini(
  input: ProfileParseInput,
): Promise<ParsedProfileInsight | null> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    return null;
  }

  if (!input.linkedInUrl?.trim() && !input.resumeText?.trim()) {
    return null;
  }

  try {
    const raw = await callGemini(buildUserPrompt(input));
    const parsed = parseGeminiJson(raw);
    const validated = parsedProfileSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn("Profile parse: Gemini schema validation failed", validated.error.flatten());
      return null;
    }

    return validated.data;
  } catch (error) {
    console.warn("Profile parse: Gemini call failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function parseProfile(input: ProfileParseInput): Promise<ParsedProfileInsight> {
  const fromGemini = await parseProfileWithGemini(input);
  return fromGemini ?? parseProfileFallback(input);
}
