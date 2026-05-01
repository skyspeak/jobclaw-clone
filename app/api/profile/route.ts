import { NextResponse } from "next/server";
import { z } from "zod";

import { generateRequestSchema, intakeQuestions } from "@/lib/jobclaw";

const profileRequestSchema = generateRequestSchema.extend({
  searchSummary: z.string().optional(),
});

const linkedInProfileSchema = z.object({
  archetype: z.object({
    name: z.string(),
    summary: z.string(),
  }),
  workStyle: z.object({
    kindOfWork: z.array(z.string()),
    motivatingProblems: z.array(z.string()),
    avoid: z.array(z.string()),
  }),
  idealJob: z.object({
    title: z.string(),
    why: z.string(),
    adjacentTitles: z.array(z.string()),
  }),
  linkedInProfile: z.object({
    headline: z.string(),
    about: z.string(),
    featured: z.array(z.string()),
    experiencePositioning: z.array(
      z.object({
        title: z.string(),
        bullets: z.array(z.string()),
      }),
    ),
    skills: z.array(z.string()),
  }),
});

export type LinkedInProfileDraft = z.infer<typeof linkedInProfileSchema>;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = profileRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid profile request payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(buildFallbackProfile(parsed.data));
  }

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      "X-Title": "DearCC presents JobClaw",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a career strategist. Convert a reflective job-search intake into a realistic, useful career archetype and LinkedIn-style profile draft. Do not invent specific employers, degrees, dates, certifications, or credentials. Use placeholders or positioning language where facts are unknown. Return only valid JSON.",
        },
        {
          role: "user",
          content: buildPrompt(parsed.data),
        },
      ],
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
    cache: "no-store",
  });

  const payload = await response.json();

  if (!response.ok) {
    console.warn("OpenRouter profile generation failed.", payload);
    return NextResponse.json(buildFallbackProfile(parsed.data));
  }

  const text = payload?.choices?.[0]?.message?.content;
  const profile = linkedInProfileSchema.safeParse(parseJsonText(text));

  if (!profile.success) {
    console.warn("OpenRouter returned an unreadable profile draft.", text);
    return NextResponse.json(buildFallbackProfile(parsed.data));
  }

  return NextResponse.json(profile.data);
}

function buildFallbackProfile(request: z.infer<typeof profileRequestSchema>): LinkedInProfileDraft {
  const answers = request.answers;
  const summary = request.searchSummary ?? "Generated a JobClaw search request.";
  const targetTitle = inferTargetTitle(summary);

  return {
    archetype: {
      name: "Reflective Career Builder",
      summary:
        "This candidate is clarifying the kind of work that fits their strengths, motivations, and constraints. Their answers point toward practical early-career roles with room to learn, contribute, and build confidence.",
    },
    workStyle: {
      kindOfWork: [
        answers.q1 || "Day-to-day work aligned with their stated interests",
        answers.q2 || "Applying under-recognized strengths",
        answers.q3 || "Solving motivating problems",
      ],
      motivatingProblems: [
        answers.q3 || "Work with a clear purpose and visible progress",
        "Learning through hands-on contribution",
        "Turning broad goals into concrete next steps",
      ],
      avoid: [
        answers.q4 || "Poor-fit environments",
        "Roles with unclear expectations",
        "Work that does not connect to their growth goals",
      ],
    },
    idealJob: {
      title: targetTitle,
      why: "This target comes from the structured JobClaw search request and the candidate's intake answers.",
      adjacentTitles: [
        "Program Coordinator",
        "Operations Assistant",
        "Customer Success Associate",
        "Research Assistant",
      ],
    },
    linkedInProfile: {
      headline: `Early-career candidate exploring ${targetTitle} roles`,
      about:
        "I am exploring roles that match the way I like to work, learn, and contribute. I am especially interested in environments where I can build practical skills, solve real problems, and grow through clear feedback and responsibility. I bring curiosity, follow-through, and a thoughtful approach to choosing work that fits.",
      featured: [
        "A short portfolio project showing how I approach a real workplace problem",
        "A reflection on the kind of role and environment where I do my best work",
        "A simple case study connecting my strengths to a target job family",
      ],
      experiencePositioning: [
        {
          title: "Career Direction and Strengths",
          bullets: [
            "Clarified target roles through a structured intake focused on strengths, interests, and constraints.",
            "Identified motivating problems and work environments that support long-term growth.",
            "Translated personal goals into a concrete early-career search direction.",
          ],
        },
      ],
      skills: [
        "Communication",
        "Problem Solving",
        "Research",
        "Organization",
        "Learning Agility",
        "Collaboration",
        "Customer Support",
        "Operations",
        "Project Coordination",
        "Career Planning",
      ],
    },
  };
}

function inferTargetTitle(summary: string) {
  const match = summary.match(/search for ([^,]+?)(?: near|, emphasizing| while|$)/i);

  return match?.[1]?.trim() || "Entry Level Program Coordinator";
}

function buildPrompt(request: z.infer<typeof profileRequestSchema>) {
  const answers = intakeQuestions.map((question) => ({
    question: question.prompt,
    answer: request.answers[question.id],
  }));

  return `Classify this candidate and draft a realistic LinkedIn profile.

Intake answers:
${JSON.stringify(answers, null, 2)}

Search defaults:
${JSON.stringify(request.defaults ?? {}, null, 2)}

Existing JobClaw search summary:
${request.searchSummary ?? "None"}

Return JSON with this exact shape:
{
  "archetype": {
    "name": "short archetype name",
    "summary": "2 sentence plain-English interpretation"
  },
  "workStyle": {
    "kindOfWork": ["3-5 concrete work activities"],
    "motivatingProblems": ["3-5 problems they likely enjoy"],
    "avoid": ["3-5 environments or role traits to avoid"]
  },
  "idealJob": {
    "title": "specific realistic target title",
    "why": "short explanation grounded in the answers",
    "adjacentTitles": ["4-6 adjacent titles"]
  },
  "linkedInProfile": {
    "headline": "realistic LinkedIn headline, no fake credentials",
    "about": "first-person LinkedIn About section, 120-180 words, grounded in the intake",
    "featured": ["3 portfolio/project ideas this person could honestly create"],
    "experiencePositioning": [
      {
        "title": "Experience area or project heading",
        "bullets": ["3 resume/LinkedIn bullets grounded in demonstrated strengths"]
      }
    ],
    "skills": ["10-14 LinkedIn skills"]
  }
}`;
}

function parseJsonText(text: string | undefined) {
  if (!text) {
    return null;
  }

  const withoutFence = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(withoutFence);
  } catch {
    const match = withoutFence.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
}
