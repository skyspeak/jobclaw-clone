import { z } from "zod";

import { wizardRowsToIntakeAnswers } from "@/lib/intake-questions";
import type { IntakeProfileDraft } from "@/lib/intake-session";

const GEMINI_PRIMARY = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_FALLBACK = "gemini-2.5-flash-lite";
const MAX_JOB_TEXT_CHARS = 12_000;
const MAX_RESUME_TEXT_CHARS = 8_000;

export const jobRequirementLevelSchema = z.enum([
  "intern",
  "entry",
  "mid",
  "senior",
  "unspecified",
]);

export const jobRequirementImportanceSchema = z.enum(["required", "preferred"]);

export const jobRequirementSchema = z.object({
  skill: z.string().min(1),
  importance: jobRequirementImportanceSchema,
  level: jobRequirementLevelSchema,
  evidence: z.string(),
});

export const candidateSkillStatusSchema = z.enum(["strong", "partial", "missing"]);

export const candidateSkillSchema = z.object({
  skill: z.string().min(1),
  status: candidateSkillStatusSchema,
  note: z.string().optional().default(""),
});

export const jobFitVerdictSchema = z.enum(["ready", "stretch", "gap"]);

export const FIXED_FIT_CRITERIA = [
  "Years of experience",
  "Leadership",
  "Team Management",
] as const;

/** @deprecated Domain rows use actual skill names at display time. */
export const FIT_MATRIX_CRITERIA = [
  ...FIXED_FIT_CRITERIA,
  "Domain expertise - skill 1",
  "Domain expertise - skill 2",
  "Domain expertise - skill 3",
] as const;

export const fitMatrixRowSchema = z.object({
  criteria: z.string(),
  jobPost: z.string(),
  yourBriefing: z.string(),
  status: candidateSkillStatusSchema.optional(),
});

export type FitMatrixRow = z.infer<typeof fitMatrixRowSchema>;

export const jobFitResultSchema = z.object({
  roleTitle: z.string(),
  seniority: z.string(),
  fitMatrix: z.array(fitMatrixRowSchema).min(1).max(6),
  verdict: jobFitVerdictSchema,
  headline: z.string(),
  summary: z.string(),
  gapsToClose: z.array(z.string()),
  requirements: z.array(jobRequirementSchema).optional(),
  candidateSkills: z.array(candidateSkillSchema).optional(),
});

const jobFitLlmResponseSchema = jobFitResultSchema
  .omit({ fitMatrix: true })
  .extend({
    fitMatrix: z.array(fitMatrixRowSchema).optional(),
    requirements: z.array(jobRequirementSchema).optional(),
    candidateSkills: z.array(candidateSkillSchema).optional(),
  });

export type JobRequirement = z.infer<typeof jobRequirementSchema>;
export type CandidateSkill = z.infer<typeof candidateSkillSchema>;
export type JobFitVerdict = z.infer<typeof jobFitVerdictSchema>;
export type JobFitResult = z.infer<typeof jobFitResultSchema>;

export const jobFitCandidateContextSchema = z.object({
  resumeText: z.string().optional().default(""),
  surveySummary: z.string().optional().default(""),
  profileDraft: z
    .object({
      archetype: z.object({ name: z.string(), summary: z.string() }).optional(),
      idealJob: z
        .object({ title: z.string(), why: z.string(), adjacentTitles: z.array(z.string()).optional() })
        .optional(),
      linkedInProfile: z
        .object({
          headline: z.string().optional(),
          about: z.string().optional(),
          skills: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .nullable()
    .optional(),
  wizardAnswers: z
    .object({
      q1: z.string().optional(),
      q2: z.string().optional(),
      q3: z.string().optional(),
      q4: z.string().optional(),
      q5: z.string().optional(),
    })
    .optional(),
});

export type JobFitCandidateContext = z.infer<typeof jobFitCandidateContextSchema>;

export const jobFitRequestSchema = z.object({
  jobDescription: z.string().optional().default(""),
  jobUrl: z.string().optional().default(""),
  candidate: jobFitCandidateContextSchema.optional(),
  submissionMeta: z
    .object({
      inputType: z.enum(["url", "paste", "library"]),
      listingId: z.string().max(100).optional(),
      listingTitle: z.string().max(300).optional(),
      intakeSubmissionId: z.string().max(100).optional(),
      submitterName: z.string().max(200).optional(),
      submitterEmail: z.string().max(320).optional(),
      submitterPhone: z.string().max(80).optional(),
    })
    .optional(),
});

const JOB_FIT_SYSTEM = `You are dear[CC], a career coach for new graduates.

Given a job description and candidate context (resume, survey, profile draft), fill a fit matrix comparing the JOB POST to the candidate's BRIEFING (materials).

Use EXACTLY six rows in this order:
1. Years of experience (criteria must be exactly "Years of experience")
2. Leadership (criteria must be exactly "Leadership")
3. Team Management (criteria must be exactly "Team Management")
4–6. The three most important domain-specific skills from the job (criteria must be the ACTUAL skill name, e.g. "Python", "SQL", "Financial modeling" — never "Domain expertise - skill 1")

For each row:
- jobPost: what the posting asks for (short phrase; cite level/years/skills from the JD only)
- yourBriefing: what the candidate's materials show (honest; say "Not evident" if missing)
- status: strong | partial | missing (compare jobPost vs yourBriefing)

Do not invent requirements not supported by the job text. Be realistic for early-career applicants.

Verdict rules:
- ready: candidate can credibly apply now; most rows strong or reasonable partial
- stretch: 1–2 meaningful gaps OR level mismatch
- gap: multiple missing criteria or clear seniority mismatch

Return ONLY valid JSON. gapsToClose: top 3–5 actionable learning targets.`;

function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function isOpenRouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY?.trim());
}

function isAiConfigured(): boolean {
  return isGeminiConfigured() || isOpenRouterConfigured();
}

function clipText(text: string, maxChars: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxChars) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxChars)}\n\n[Truncated for analysis.]`;
}

function buildUserPrompt(jobText: string, candidate: JobFitCandidateContext): string {
  const answers = candidate.wizardAnswers ?? {};
  const profile = candidate.profileDraft;

  return `
Job description:
${clipText(jobText, MAX_JOB_TEXT_CHARS)}

Candidate survey summary:
${candidate.surveySummary?.trim() || "Not provided."}

Candidate profile draft:
${profile?.archetype?.name ? `Archetype: ${profile.archetype.name}\n${profile.archetype.summary}` : "Not provided."}
${profile?.idealJob?.title ? `Ideal role: ${profile.idealJob.title}\n${profile.idealJob.why}` : ""}
${profile?.linkedInProfile?.headline ? `Headline: ${profile.linkedInProfile.headline}` : ""}
${profile?.linkedInProfile?.about ? `About: ${profile.linkedInProfile.about}` : ""}
${profile?.linkedInProfile?.skills?.length ? `Listed skills: ${profile.linkedInProfile.skills.join(", ")}` : ""}

Intake answers (if any):
Q1: ${answers.q1 ?? ""}
Q2: ${answers.q2 ?? ""}
Q3: ${answers.q3 ?? ""}
Q4: ${answers.q4 ?? ""}
Q5: ${answers.q5 ?? ""}

Resume text:
${clipText(candidate.resumeText?.trim() || "Not provided.", MAX_RESUME_TEXT_CHARS)}

Return JSON:
{
  "roleTitle": "inferred title",
  "seniority": "e.g. Entry level, Internship, Mid-Senior",
  "fitMatrix": [
    { "criteria": "Years of experience", "jobPost": "...", "yourBriefing": "...", "status": "strong|partial|missing" },
    { "criteria": "Leadership", "jobPost": "...", "yourBriefing": "...", "status": "strong|partial|missing" },
    { "criteria": "Team Management", "jobPost": "...", "yourBriefing": "...", "status": "strong|partial|missing" },
    { "criteria": "Python", "jobPost": "...", "yourBriefing": "...", "status": "strong|partial|missing" },
    { "criteria": "SQL", "jobPost": "...", "yourBriefing": "...", "status": "strong|partial|missing" },
    { "criteria": "Customer discovery", "jobPost": "...", "yourBriefing": "...", "status": "strong|partial|missing" }
  ],
  "verdict": "ready|stretch|gap",
  "headline": "short user-facing headline",
  "summary": "2-4 sentences explaining the fit",
  "gapsToClose": ["...", "..."]
}
`.trim();
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
      systemInstruction: { parts: [{ text: JOB_FIT_SYSTEM }] },
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
    throw new Error("Gemini returned no text");
  }
  return text;
}

function cleanJsonText(text: string): string {
  return text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
}

function parseJobFitJson(text: string): unknown | null {
  const cleaned = cleanJsonText(text);
  if (!cleaned) {
    return null;
  }

  try {
    return JSON.parse(cleaned) as unknown;
  } catch {
    const start = cleaned.indexOf("{");
    if (start < 0) {
      return null;
    }

    let depth = 0;
    let end = -1;
    for (let i = start; i < cleaned.length; i += 1) {
      const char = cleaned[i];
      if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }

    if (end <= start) {
      return null;
    }

    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as unknown;
    } catch {
      return null;
    }
  }
}

function criteriaKey(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function isGenericDomainCriteria(criteria: string): boolean {
  return /domain expertise\s*[-–]?\s*skill\s*\d/i.test(criteria.trim());
}

function isFixedCriteria(criteria: string): boolean {
  const key = criteriaKey(criteria);
  return FIXED_FIT_CRITERIA.some((label) => criteriaKey(label) === key);
}

function findRowByCriteria(label: string, rows: FitMatrixRow[]): FitMatrixRow | undefined {
  const key = criteriaKey(label);
  return (
    rows.find((row) => criteriaKey(row.criteria) === key) ??
    rows.find((row) => criteriaKey(row.criteria).includes(key.slice(0, 10)))
  );
}

function extractTopDomainSkillNames(
  requirements: JobRequirement[],
  jobText: string,
): string[] {
  const excluded = new Set([
    "years of experience",
    "leadership",
    "team management",
    "communication",
    "learning agility",
    "problem solving",
    "collaboration",
  ]);

  const fromRequirements = requirements
    .map((r) => r.skill.trim())
    .filter((skill) => skill && !excluded.has(criteriaKey(skill)));

  const fromJob = extractSkillHintsFromText(jobText).filter(
    (skill) => !excluded.has(criteriaKey(skill)),
  );

  return Array.from(new Set([...fromRequirements, ...fromJob])).slice(0, 3);
}

function resolveDomainCriteriaName(
  row: FitMatrixRow | undefined,
  domainIndex: number,
  domainSkillNames: string[],
): string {
  const named = domainSkillNames[domainIndex]?.trim();
  if (row && !isGenericDomainCriteria(row.criteria)) {
    return row.criteria.trim();
  }
  if (named) {
    return named;
  }
  return `Domain skill ${domainIndex + 1}`;
}

function normalizeFitMatrixRows(
  rows: FitMatrixRow[] | undefined,
  requirements: JobRequirement[] = [],
  candidateSkills: CandidateSkill[] = [],
  jobText = "",
): FitMatrixRow[] {
  const llmRows = rows ?? [];
  const domainSkillNames = extractTopDomainSkillNames(requirements, jobText);
  const domainLlmRows = llmRows.filter((row) => !isFixedCriteria(row.criteria));

  const fixedRows = FIXED_FIT_CRITERIA.map((label) => {
    const existing = findRowByCriteria(label, llmRows);
    return {
      criteria: label,
      jobPost: existing?.jobPost.trim() || "Not stated in posting.",
      yourBriefing: existing?.yourBriefing.trim() || "Not evident in your brief.",
      status: existing?.status,
    };
  });

  const domainRows = [0, 1, 2].map((domainIndex) => {
    const genericLabel = `Domain expertise - skill ${domainIndex + 1}`;
    const existing =
      domainLlmRows[domainIndex] ??
      findRowByCriteria(genericLabel, llmRows) ??
      llmRows.filter((row) => isGenericDomainCriteria(row.criteria))[domainIndex];

    const skillName = resolveDomainCriteriaName(existing, domainIndex, domainSkillNames);
    const req = requirements.find((r) => criteriaKey(r.skill) === criteriaKey(skillName));
    const match = candidateSkills.find(
      (c) => criteriaKey(c.skill) === criteriaKey(skillName),
    );

    return {
      criteria: skillName,
      jobPost:
        existing?.jobPost.trim() ||
        req?.evidence ||
        (domainSkillNames[domainIndex] ? `${skillName} mentioned in posting.` : "Not emphasized in posting."),
      yourBriefing:
        existing?.yourBriefing.trim() ||
        match?.note ||
        "Not evident in your brief.",
      status: existing?.status ?? match?.status ?? "missing",
    };
  });

  return [...fixedRows, ...domainRows];
}

export function normalizeJobFitResult(
  raw: z.infer<typeof jobFitLlmResponseSchema>,
  jobText = "",
): JobFitResult {
  const fitMatrix = normalizeFitMatrixRows(
    raw.fitMatrix,
    raw.requirements ?? [],
    raw.candidateSkills ?? [],
    jobText,
  );

  return {
    roleTitle: raw.roleTitle,
    seniority: raw.seniority,
    fitMatrix,
    verdict: raw.verdict,
    headline: raw.headline,
    summary: raw.summary,
    gapsToClose: raw.gapsToClose,
    requirements: raw.requirements,
    candidateSkills: raw.candidateSkills,
  };
}

function validateJobFitJson(text: string, jobText = ""): JobFitResult | null {
  const parsed = parseJobFitJson(text);
  if (!parsed) {
    return null;
  }
  const validated = jobFitLlmResponseSchema.safeParse(parsed);
  if (!validated.success) {
    return null;
  }
  return normalizeJobFitResult(validated.data, jobText);
}

export function applyVerdictGuardrails(result: JobFitResult): JobFitResult {
  const fitMatrix = normalizeFitMatrixRows(result.fitMatrix);

  let missingRequired = 0;
  for (const row of fitMatrix) {
    const status = row.status ?? inferStatusFromBriefing(row.yourBriefing);
    if (status === "missing") {
      missingRequired += 1;
    }
  }

  const missingRatio = fitMatrix.length > 0 ? missingRequired / fitMatrix.length : 0;

  let verdict = result.verdict;
  if (missingRatio > 0.5) {
    verdict = "gap";
  } else if (missingRatio > 0.25 && verdict === "ready") {
    verdict = "stretch";
  }

  const headlines: Record<JobFitVerdict, string> = {
    ready: "You can credibly go for this role",
    stretch: "Stretch role — close a few gaps first",
    gap: "Build more skills before applying",
  };

  return {
    ...result,
    fitMatrix: fitMatrix.map((row) => ({
      ...row,
      status: row.status ?? inferStatusFromBriefing(row.yourBriefing),
    })),
    verdict,
    headline: headlines[verdict],
    gapsToClose: result.gapsToClose.slice(0, 5),
  };
}

function inferStatusFromBriefing(
  yourBriefing: string,
): z.infer<typeof candidateSkillStatusSchema> {
  const lower = yourBriefing.toLowerCase();
  if (
    lower.includes("not evident") ||
    lower.includes("not shown") ||
    lower.includes("missing") ||
    lower.includes("no evidence")
  ) {
    return "missing";
  }
  if (lower.includes("partial") || lower.includes("some") || lower.includes("limited")) {
    return "partial";
  }
  return "strong";
}

async function analyzeWithOpenRouter(
  jobText: string,
  candidate: JobFitCandidateContext,
): Promise<JobFitResult | null> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": "dear[CC]",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: JOB_FIT_SYSTEM },
          { role: "user", content: buildUserPrompt(jobText, candidate) },
        ],
        temperature: 0.35,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    return validateJobFitJson(content, jobText);
  } catch {
    return null;
  }
}

async function analyzeWithGemini(
  jobText: string,
  candidate: JobFitCandidateContext,
): Promise<JobFitResult | null> {
  if (!isGeminiConfigured()) {
    return null;
  }

  const prompt = buildUserPrompt(jobText, candidate);
  const models = [GEMINI_PRIMARY, GEMINI_FALLBACK];

  for (const model of models) {
    try {
      const raw = await callGeminiModel(model, prompt);
      const result = validateJobFitJson(raw, jobText);
      if (result) {
        return result;
      }
      console.warn(`Gemini job-fit (${model}): response failed JSON validation.`);
    } catch (err) {
      const status = (err as { status?: number }).status;
      console.warn(`Gemini job-fit (${model}) failed.`, err);
      if (status !== 429 && status !== 503) {
        continue;
      }
    }
  }

  return null;
}

const SKILL_HINTS = [
  "Communication",
  "Problem Solving",
  "Collaboration",
  "Data Analysis",
  "Python",
  "SQL",
  "Excel",
  "Research",
  "Writing",
  "Project Management",
  "Customer Support",
  "Presentation",
  "Leadership",
  "Marketing",
  "Design",
  "Operations",
];

function extractSkillHintsFromText(text: string): string[] {
  const lower = text.toLowerCase();
  const found = SKILL_HINTS.filter((skill) => lower.includes(skill.toLowerCase()));
  const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b/g) ?? [];
  const fromCaps = words
    .filter((w) => w.length > 3 && w.length < 40)
    .slice(0, 8);

  return Array.from(new Set([...found, ...fromCaps])).slice(0, 12);
}

export function buildFallbackJobFit(
  jobText: string,
  candidate: JobFitCandidateContext,
  options?: { aiConfigured?: boolean },
): JobFitResult {
  const resume = candidate.resumeText ?? "";
  const requirements: JobRequirement[] = extractSkillHintsFromText(jobText).map((skill) => ({
    skill,
    importance: "required" as const,
    level: "unspecified" as const,
    evidence: `Mentioned or implied in the job description.`,
  }));

  if (requirements.length < 5) {
    requirements.push(
      { skill: "Communication", importance: "required", level: "entry", evidence: "Typical early-career expectation." },
      { skill: "Learning agility", importance: "required", level: "entry", evidence: "Typical early-career expectation." },
    );
  }

  const candidateSkills: CandidateSkill[] = requirements.map((req) => {
    const inResume = resume.toLowerCase().includes(req.skill.toLowerCase());
    return {
      skill: req.skill,
      status: inResume ? "strong" : "missing",
      note: inResume ? "Supported in resume text." : "Not clearly shown in resume.",
    };
  });

  const missing = candidateSkills.filter((c) => c.status === "missing").length;
  const verdict: JobFitVerdict =
    missing === 0 ? "ready" : missing <= 2 ? "stretch" : "gap";
  const seniority = inferSeniority(jobText);
  const lowerJob = jobText.toLowerCase();
  const lowerResume = resume.toLowerCase();

  const fitMatrix = normalizeFitMatrixRows(
    [
      {
        criteria: "Years of experience",
        jobPost: seniority,
        yourBriefing: lowerResume.includes("intern") || lowerResume.includes("student")
          ? "Early-career / student experience in materials."
          : "Experience level not clearly stated in brief.",
        status:
          lowerJob.includes("senior") && !lowerResume.includes("senior") ? "missing" : "partial",
      },
      {
        criteria: "Leadership",
        jobPost: lowerJob.includes("lead") ? "Leadership expected." : "Leadership not emphasized.",
        yourBriefing: lowerResume.match(/lead|president|captain|chair/)
          ? "Some leadership signals in brief."
          : "Not evident in your brief.",
        status: lowerResume.match(/lead|president|captain|chair/) ? "partial" : "missing",
      },
      {
        criteria: "Team Management",
        jobPost: lowerJob.match(/team|manage|supervis/)
          ? "Team or people management mentioned."
          : "Not emphasized in posting.",
        yourBriefing: lowerResume.match(/team|collaborat|group project/)
          ? "Team collaboration mentioned."
          : "Not evident in your brief.",
        status: lowerResume.match(/team|collaborat|group project/) ? "partial" : "missing",
      },
    ],
    requirements.slice(0, 12),
    candidateSkills,
    jobText,
  );

  return applyVerdictGuardrails({
    roleTitle: inferRoleTitle(jobText),
    seniority,
    fitMatrix,
    candidateSkills,
    requirements: requirements.slice(0, 12),
    verdict,
    headline: "",
    summary: options?.aiConfigured
      ? "AI analysis did not complete (often when a fetched posting is very long). This is a rough keyword scan—try again or paste a shorter job description for a full analysis."
      : "This is a quick skills scan without an AI key configured. Add GEMINI_API_KEY or OPENROUTER_API_KEY in .env.local for a deeper analysis.",
    gapsToClose: candidateSkills
      .filter((c) => c.status === "missing")
      .map((c) => c.skill)
      .slice(0, 5),
  });
}

function inferRoleTitle(jobText: string): string {
  const match = jobText.match(/(?:job title|position|role)[:\s]+([^\n]{3,80})/i);
  if (match?.[1]) {
    return match[1].trim();
  }
  const firstLine = jobText.split("\n").find((l) => l.trim().length > 3)?.trim();
  return firstLine?.slice(0, 80) ?? "Target role";
}

function inferSeniority(jobText: string): string {
  const lower = jobText.toLowerCase();
  if (lower.includes("intern")) return "Internship";
  if (lower.includes("entry level") || lower.includes("entry-level")) return "Entry level";
  if (lower.includes("senior")) return "Senior";
  if (lower.includes("mid")) return "Mid-level";
  return "Entry level";
}

export function buildCandidateContextFromSession(session: {
  resumeText: string;
  result: { summary: string } | null;
  profileDraft: IntakeProfileDraft | null;
  wizardAnswers: string[];
}): JobFitCandidateContext {
  const answers = wizardRowsToIntakeAnswers(session.wizardAnswers);

  return {
    resumeText: session.resumeText,
    surveySummary: session.result?.summary ?? "",
    profileDraft: session.profileDraft,
    wizardAnswers: answers,
  };
}

export async function analyzeJobFit(input: {
  jobText: string;
  candidate: JobFitCandidateContext;
}): Promise<JobFitResult> {
  const candidate = jobFitCandidateContextSchema.parse(input.candidate);
  const jobText = clipText(input.jobText.trim(), MAX_JOB_TEXT_CHARS);
  const aiConfigured = isAiConfigured();

  const geminiResult = await analyzeWithGemini(jobText, candidate);
  if (geminiResult) {
    return applyVerdictGuardrails(geminiResult);
  }

  const openRouterResult = await analyzeWithOpenRouter(jobText, candidate);
  if (openRouterResult) {
    return applyVerdictGuardrails(openRouterResult);
  }

  return buildFallbackJobFit(jobText, candidate, { aiConfigured });
}

export function verdictLabel(verdict: JobFitVerdict): string {
  switch (verdict) {
    case "ready":
      return "You can win this job";
    case "stretch":
      return "Stretch — sharpen a few skills";
    case "gap":
      return "Build skills before applying";
  }
}

export function verdictDescription(verdict: JobFitVerdict): string {
  switch (verdict) {
    case "ready":
      return "Your profile lines up with most required skills for this posting.";
    case "stretch":
      return "You are close, but a few gaps or level mismatches remain.";
    case "gap":
      return "Several required skills are not yet visible in your materials.";
  }
}
