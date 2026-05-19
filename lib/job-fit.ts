import { z } from "zod";

import { wizardRowsToIntakeAnswers } from "@/lib/intake-questions";
import type { IntakeProfileDraft } from "@/lib/intake-session";

const GEMINI_PRIMARY = process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
const GEMINI_FALLBACK = "gemini-2.5-flash-lite";

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

export const jobFitResultSchema = z.object({
  roleTitle: z.string(),
  seniority: z.string(),
  requirements: z.array(jobRequirementSchema),
  candidateSkills: z.array(candidateSkillSchema),
  verdict: jobFitVerdictSchema,
  headline: z.string(),
  summary: z.string(),
  gapsToClose: z.array(z.string()),
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
});

const geminiJobFitSchema = jobFitResultSchema;

const JOB_FIT_SYSTEM = `You are JobClaw, a career coach for new graduates.

Given a job description and candidate context (resume, survey, profile draft), extract skills and experience levels from the job ONLY—do not invent requirements not supported by the job text.

Compare the candidate honestly to each requirement. Be encouraging but realistic for early-career applicants.

Verdict rules:
- ready: candidate can credibly apply now; required skills are mostly strong or reasonable partial
- stretch: 1–2 meaningful gaps OR level mismatch (job wants mid/senior, candidate reads entry)
- gap: multiple missing required skills OR clear seniority mismatch

Return ONLY valid JSON matching the schema. Each requirement needs a short evidence snippet from the job description (paraphrase OK). Cap requirements at 12–15 skills. gapsToClose: top 3–5 learning targets as actionable phrases.`;

function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function buildUserPrompt(jobText: string, candidate: JobFitCandidateContext): string {
  const answers = candidate.wizardAnswers ?? {};
  const profile = candidate.profileDraft;

  return `
Job description:
${jobText}

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
${candidate.resumeText?.trim() || "Not provided."}

Return JSON:
{
  "roleTitle": "inferred title",
  "seniority": "e.g. Entry level, Internship, Mid-Senior",
  "requirements": [
    { "skill": "...", "importance": "required|preferred", "level": "intern|entry|mid|senior|unspecified", "evidence": "..." }
  ],
  "candidateSkills": [
    { "skill": "...", "status": "strong|partial|missing", "note": "optional short note" }
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

function parseJsonText(text: string): unknown {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/, "")
    .replace(/```\s*$/, "");
  return JSON.parse(cleaned) as unknown;
}

export function applyVerdictGuardrails(result: JobFitResult): JobFitResult {
  const required = result.requirements.filter((r) => r.importance === "required");
  const requiredSkills = required.length > 0 ? required : result.requirements;

  const statusBySkill = new Map(
    result.candidateSkills.map((c) => [c.skill.toLowerCase(), c.status] as const),
  );

  let missingRequired = 0;
  for (const req of requiredSkills) {
    const status =
      statusBySkill.get(req.skill.toLowerCase()) ??
      result.candidateSkills.find((c) =>
        c.skill.toLowerCase().includes(req.skill.toLowerCase().slice(0, 8)),
      )?.status;
    if (status === "missing" || !status) {
      missingRequired += 1;
    }
  }

  const missingRatio =
    requiredSkills.length > 0 ? missingRequired / requiredSkills.length : 0;

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
    verdict,
    headline: headlines[verdict],
    gapsToClose: result.gapsToClose.slice(0, 5),
    requirements: result.requirements.slice(0, 15),
  };
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
        "X-Title": "DearCC presents JobClaw",
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

    const parsed = geminiJobFitSchema.safeParse(parseJsonText(content));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
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

  return applyVerdictGuardrails({
    roleTitle: inferRoleTitle(jobText),
    seniority: inferSeniority(jobText),
    requirements: requirements.slice(0, 12),
    candidateSkills,
    verdict,
    headline: "",
    summary:
      "This is a quick skills scan without an AI key configured. Add GEMINI_API_KEY or OPENROUTER_API_KEY for a deeper analysis grounded in the full job description.",
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
  const jobText = input.jobText.trim();

  if (isGeminiConfigured()) {
    try {
      const raw = await callGemini(buildUserPrompt(jobText, candidate));
      const parsed = geminiJobFitSchema.safeParse(parseJsonText(raw));
      if (parsed.success) {
        return applyVerdictGuardrails(parsed.data);
      }
    } catch (err) {
      console.warn("Gemini job-fit analysis failed, trying fallback.", err);
    }
  }

  const openRouterResult = await analyzeWithOpenRouter(jobText, candidate);
  if (openRouterResult) {
    return applyVerdictGuardrails(openRouterResult);
  }

  return buildFallbackJobFit(jobText, candidate);
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
