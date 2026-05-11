import * as z from "zod";

import { defaultSearchDefaults, type SearchDefaults } from "@/lib/jobclaw";

export type IntakeQuestionItem = {
  prompt: string;
  hint?: string;
  options: string[];
};

export const QUESTIONS: IntakeQuestionItem[] = [
  {
    prompt: "It's 5 years from now and you love your work. What are you actually doing on a typical day?",
    hint: "Think about activities, not job titles.",
    options: [
      "Working closely with people",
      "Building or making things with my hands",
      "Researching, writing, or thinking deeply",
      "Leading a small team",
      "Solving puzzles with data or systems",
      "Creating something new",
    ],
  },
  {
    prompt: "What are you genuinely good at that you've never put on your resume or LinkedIn?",
    hint: "The quiet skills people thank you for.",
    options: [
      "Listening so people feel heard",
      "Spotting patterns others miss",
      "Calming chaotic situations",
      "Explaining complex things simply",
      "Bringing the right people together",
      "Asking the question nobody else will",
    ],
  },
  {
    prompt: "What kind of problem makes you excited to come in on a Monday?",
    hint: "Pick what fits — or write your own.",
    options: [
      "Hands-on / physical work",
      "Research and ideas",
      "Helping people directly",
      "Data and systems",
      "Something creative",
      "Building a business",
    ],
  },
  {
    prompt: "What would make you dread going to work, even if the pay was great?",
    hint: "Be honest — this filters out bad fits.",
    options: [
      "Endless pointless meetings",
      "Cutthroat sales culture",
      "Office politics and gossip",
      "Rigid hours, no flexibility",
      "Working in isolation all day",
      "Work that feels meaningless",
    ],
  },
  {
    prompt: "A year from now, what would make you feel like you actually moved forward?",
    hint: "Define what 'progress' means to you.",
    options: [
      "Steady, reliable income",
      "Learning a new skill deeply",
      "Real impact on something I care about",
      "A team I genuinely enjoy",
      "Better work-life balance",
      "Working toward my own thing",
    ],
  },
];

export const questionSchema = z.object({
  answer: z.string().min(5, "Please share a bit more — even one sentence helps."),
});

export const prefsSchema = z.object({
  location: z.string().optional(),
  workMode: z.enum(["Any", "Remote", "Hybrid", "On-site"]).optional(),
  seniority: z
    .enum(["Any", "Internship", "Entry level", "Associate", "Mid-Senior level", "Director", "Executive"])
    .optional(),
  minSalary: z.string().optional(),
  requireVisaSponsorship: z.boolean(),
  preferVolunteerRoles: z.boolean(),
  maxResults: z.number().min(1).max(20),
  notes: z.string().optional(),
});

export type PrefsValues = z.infer<typeof prefsSchema>;

export function appendChip(current: string, chip: string): string {
  const trimmed = current.trim();
  if (!trimmed) return chip;
  if (trimmed.toLowerCase().includes(chip.toLowerCase())) return current;
  const sep = /[.!?]$/.test(trimmed) ? " " : trimmed.endsWith(",") ? " " : ", ";
  return `${trimmed}${sep}${chip}`;
}

export function prefsValuesToSearchDefaults(prefs: PrefsValues): SearchDefaults {
  return {
    ...defaultSearchDefaults,
    location: prefs.location ?? "",
    workMode: prefs.workMode ?? "Any",
    seniority: prefs.seniority ?? "Any",
    minSalary: prefs.minSalary ?? "",
    requireVisaSponsorship: prefs.requireVisaSponsorship,
    preferVolunteerRoles: prefs.preferVolunteerRoles,
    maxResults:
      typeof prefs.maxResults === "number" && Number.isFinite(prefs.maxResults)
        ? prefs.maxResults
        : defaultSearchDefaults.maxResults,
    notes: prefs.notes ?? "",
  };
}

export function searchDefaultsToPrefsValues(defaults: SearchDefaults): PrefsValues {
  return {
    location: defaults.location || undefined,
    workMode: defaults.workMode,
    seniority: defaults.seniority,
    minSalary: defaults.minSalary || undefined,
    requireVisaSponsorship: defaults.requireVisaSponsorship,
    preferVolunteerRoles: defaults.preferVolunteerRoles,
    maxResults: defaults.maxResults,
    notes: defaults.notes || undefined,
  };
}
