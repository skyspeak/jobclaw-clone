import { z } from "zod";

export type IntakeQuestionId = "q1" | "q2" | "q3" | "q4" | "q5";

export type WorkMode = "Any" | "Remote" | "Hybrid" | "On-site";

export type Seniority =
  | "Any"
  | "Internship"
  | "Entry level"
  | "Associate"
  | "Mid-Senior level"
  | "Director"
  | "Executive";

export type SearchDefaults = {
  provider: string;
  location: string;
  workMode: WorkMode;
  seniority: Seniority;
  minSalary: string;
  requireVisaSponsorship: boolean;
  preferVolunteerRoles: boolean;
  maxResults: number;
  riasecOverride: string;
  notes: string;
};

export type IntakeAnswers = Record<IntakeQuestionId, string>;

export type SearchRequest = {
  provider: string;
  jobTitle: string;
  keywords: string[];
  exclusions: string[];
  location: string;
  workMode: WorkMode;
  seniority: Seniority;
  minSalary: string;
  requireVisaSponsorship: boolean;
  maxResults: number;
};

export type JobClawResponse = {
  summary: string;
  searchRequest: SearchRequest | null;
};

export const intakeQuestions: Array<{
  id: IntakeQuestionId;
  label: string;
  prompt: string;
}> = [
  {
    id: "q1",
    label: "Future day-to-day",
    prompt:
      "It's 5 years from now and you love your work. What are you actually doing on a typical day?",
  },
  {
    id: "q2",
    label: "Hidden strengths",
    prompt:
      "What are you genuinely good at that you never put on your resume or LinkedIn?",
  },
  {
    id: "q3",
    label: "Energizing problems",
    prompt:
      "What kind of problem makes you excited to come in on a Monday? Think hands-on, research, helping people, data/systems, creative work, or building a business.",
  },
  {
    id: "q4",
    label: "Deal-breakers",
    prompt:
      "What would make you dread going to work, even if the pay was great?",
  },
  {
    id: "q5",
    label: "One-year progress",
    prompt:
      "A year from now, what would make you feel like you actually moved forward?",
  },
];

export const defaultSearchDefaults: SearchDefaults = {
  provider: "linkedin",
  location: "",
  workMode: "Any",
  seniority: "Any",
  minSalary: "",
  requireVisaSponsorship: false,
  preferVolunteerRoles: false,
  maxResults: 5,
  riasecOverride: "",
  notes: "",
};

export const generateRequestSchema = z.object({
  answers: z.object({
    q1: z.string(),
    q2: z.string(),
    q3: z.string(),
    q4: z.string(),
    q5: z.string(),
  }),
  defaults: z
    .object({
      provider: z.string().optional(),
      location: z.string().optional(),
      workMode: z
        .enum(["Any", "Remote", "Hybrid", "On-site"])
        .optional(),
      seniority: z
        .enum([
          "Any",
          "Internship",
          "Entry level",
          "Associate",
          "Mid-Senior level",
          "Director",
          "Executive",
        ])
        .optional(),
      minSalary: z.string().optional(),
      requireVisaSponsorship: z.boolean().optional(),
      preferVolunteerRoles: z.boolean().optional(),
      maxResults: z.coerce.number().int().min(1).max(50).optional(),
      riasecOverride: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
});

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

const keywordSignals = [
  "training",
  "onboarding",
  "learning",
  "instructional design",
  "workforce development",
  "operations",
  "data",
  "systems",
  "research",
  "community",
  "education",
  "program",
  "customer success",
  "support",
  "analyst",
  "design",
  "writing",
  "automation",
  "coordination",
  "project",
  "nonprofit",
  "youth",
  "lms",
];

const roleRules: Array<{ terms: string[]; title: string }> = [
  {
    terms: ["training", "onboarding", "learning", "instructional"],
    title: "Learning and Development Coordinator",
  },
  {
    terms: ["community", "nonprofit", "program", "youth", "volunteer"],
    title: "Community Program Coordinator",
  },
  {
    terms: ["data", "systems", "analyst", "operations"],
    title: "Operations Analyst",
  },
  {
    terms: ["research", "ideas", "policy"],
    title: "Research Assistant",
  },
  {
    terms: ["customer", "support", "helping people"],
    title: "Customer Success Associate",
  },
  {
    terms: ["design", "creative", "content", "writing"],
    title: "Content Coordinator",
  },
];

export function createJobClawResponse(request: GenerateRequest): JobClawResponse {
  const answers = normalizeAnswers(request.answers);
  const defaults = { ...defaultSearchDefaults, ...request.defaults };
  const missing = intakeQuestions.filter(({ id }) => !answers[id].trim());

  if (missing.length > 0) {
    const labels = missing.map(({ id }) => id.toUpperCase()).join(" and ");
    return {
      summary: `Missing answers for ${labels} in the intake.`,
      searchRequest: null,
    };
  }

  const combined = [
    answers.q1,
    answers.q2,
    answers.q3,
    answers.q5,
    defaults.notes,
    defaults.riasecOverride,
    defaults.preferVolunteerRoles ? "volunteer nonprofit community" : "",
  ]
    .join(" ")
    .toLowerCase();

  const jobTitle = inferJobTitle(combined, defaults.preferVolunteerRoles);
  const keywords = inferKeywords(combined, defaults.preferVolunteerRoles);
  const exclusions = inferExclusions(answers.q4);

  return {
    summary: buildSummary(jobTitle, keywords, exclusions, defaults),
    searchRequest: {
      provider: defaults.preferVolunteerRoles ? "idealist" : defaults.provider || "linkedin",
      jobTitle,
      keywords,
      exclusions,
      location: defaults.location,
      workMode: defaults.workMode,
      seniority: defaults.seniority,
      minSalary: defaults.minSalary,
      requireVisaSponsorship: defaults.requireVisaSponsorship,
      maxResults: defaults.maxResults,
    },
  };
}

function normalizeAnswers(answers: IntakeAnswers): IntakeAnswers {
  return {
    q1: answers.q1 ?? "",
    q2: answers.q2 ?? "",
    q3: answers.q3 ?? "",
    q4: answers.q4 ?? "",
    q5: answers.q5 ?? "",
  };
}

function inferJobTitle(text: string, preferVolunteerRoles: boolean): string {
  if (preferVolunteerRoles) {
    return "Volunteer Program Coordinator";
  }

  const match = roleRules.find(({ terms }) =>
    terms.some((term) => text.includes(term)),
  );

  return match?.title ?? "Entry Level Program Coordinator";
}

function inferKeywords(text: string, preferVolunteerRoles: boolean): string[] {
  const found = keywordSignals.filter((signal) => text.includes(signal));
  const keywords = Array.from(new Set(found));

  if (preferVolunteerRoles) {
    keywords.unshift("volunteer", "mission-driven");
  }

  if (keywords.length < 3) {
    keywords.push("entry level", "career growth", "early career");
  }

  return Array.from(new Set(keywords)).slice(0, 5);
}

function inferExclusions(answer: string): string[] {
  const fragments = answer
    .split(/,|;|\bor\b|\band\b/gi)
    .map((fragment) => fragment.trim().replace(/\.$/, ""))
    .filter(Boolean);

  if (fragments.length === 0) {
    return [];
  }

  return Array.from(new Set(fragments)).slice(0, 5);
}

function buildSummary(
  jobTitle: string,
  keywords: string[],
  exclusions: string[],
  defaults: SearchDefaults,
): string {
  const location = defaults.location ? ` near ${defaults.location}` : "";
  const avoid =
    exclusions.length > 0 ? ` while avoiding ${exclusions.slice(0, 2).join(" and ")}` : "";

  return `Inferred a ${defaults.seniority.toLowerCase()} search for ${jobTitle}${location}, emphasizing ${keywords.slice(0, 3).join(", ")}${avoid}.`;
}
