import { z } from "zod";

import { tryParseGeminiJson } from "@/lib/gemini-json";
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
  "suggestedRoles": ["3-5 realistic job titles — prefer Sales, Marketing, Forward Deployed Engineer, or Software Engineer when the profile fits"],
  "filtersIntro": "1-2 short sentences in second person (max 200 characters; no unescaped quotes)"
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

async function callGeminiModel(
  model: string,
  userText: string,
): Promise<{ text: string; finishReason: string | null; model: string }> {
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
        temperature: 0.3,
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
    candidates?: Array<{
      finishReason?: string;
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const candidate = json.candidates?.[0];
  const text = candidate?.content?.parts?.[0]?.text;
  if (!text?.trim()) {
    throw new Error("Gemini returned no text content");
  }

  return {
    text,
    finishReason: candidate?.finishReason ?? null,
    model,
  };
}

async function callGemini(userText: string): Promise<{ text: string; finishReason: string | null; model: string }> {
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

function parseGeminiResponse(
  raw: string,
  meta: { model: string; finishReason: string | null },
): ParsedProfileInsight | null {
  const parsed = tryParseGeminiJson(raw);

  if (!parsed.ok) {
    // #region agent log
    fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
      body: JSON.stringify({
        sessionId: "248634",
        runId: "pre-fix",
        hypothesisId: "GP1",
        location: "lib/profile-parse.ts:parse-fail",
        message: "Gemini JSON parse failed",
        data: {
          model: meta.model,
          finishReason: meta.finishReason,
          rawLength: parsed.rawLength,
          preview: parsed.preview,
          error: parsed.error,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    return null;
  }

  const validated = parsedProfileSchema.safeParse(parsed.value);
  if (!validated.success) {
    console.warn("Profile parse: Gemini schema validation failed", validated.error.flatten());
    return null;
  }

  return validated.data;
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

  const userPrompt = buildUserPrompt(input);
  const models = [GEMINI_PRIMARY, GEMINI_FALLBACK];

  try {
    for (let index = 0; index < models.length; index += 1) {
      const model = models[index]!;
      let response: { text: string; finishReason: string | null; model: string };

      try {
        response = index === 0 ? await callGemini(userPrompt) : await callGeminiModel(model, userPrompt);
      } catch (error) {
        const status = (error as { status?: number }).status;
        if (index < models.length - 1 && (status === 429 || status === 503)) {
          continue;
        }
        throw error;
      }

      const insight = parseGeminiResponse(response.text, {
        model: response.model,
        finishReason: response.finishReason,
      });

      if (insight) {
        // #region agent log
        fetch("http://127.0.0.1:7404/ingest/846aff6a-131c-4797-a19f-d5f9dc56d30b", {
          method: "POST",
          headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "248634" },
          body: JSON.stringify({
            sessionId: "248634",
            runId: "pre-fix",
            hypothesisId: "GP2",
            location: "lib/profile-parse.ts:parse-ok",
            message: "Gemini profile parse succeeded",
            data: { model: response.model, finishReason: response.finishReason, attempt: index + 1 },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        return insight;
      }

      const shouldRetry = index < models.length - 1;

      if (!shouldRetry) {
        break;
      }
    }

    return null;
  } catch (error) {
    console.warn("Profile parse: Gemini call failed", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
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
    { terms: ["forward deployed", "fde", "solutions engineer", "field engineer"], role: "Forward Deployed Engineer" },
    { terms: ["software engineer", "developer", "backend", "frontend", "full stack", "swe"], role: "Software Engineer" },
    { terms: ["marketing", "growth", "brand", "content", "gtm", "demand gen"], role: "Marketing" },
    { terms: ["sales", "account executive", "bdr", "sdr", "business development"], role: "Sales" },
    { terms: ["operations", "process"], role: "Operations Coordinator" },
    { terms: ["customer", "support"], role: "Customer Success Associate" },
    { terms: ["program", "community"], role: "Program Coordinator" },
    { terms: ["data", "analytics"], role: "Data Analyst" },
  ];

  const suggestedRoles = roleRules
    .filter(({ terms }) => terms.some((term) => text.includes(term)))
    .map(({ role }) => role)
    .slice(0, 5);

  if (suggestedRoles.length === 0) {
    suggestedRoles.push("Marketing", "Software Engineer", "Sales");
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

export async function parseProfile(input: ProfileParseInput): Promise<ParsedProfileInsight> {
  const useGemini =
    process.env.NODE_ENV !== "development" && Boolean(process.env.GEMINI_API_KEY?.trim());
  const fromGemini = useGemini ? await parseProfileWithGemini(input) : null;
  return fromGemini ?? parseProfileFallback(input);
}
