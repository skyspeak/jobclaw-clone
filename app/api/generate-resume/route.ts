import { NextResponse } from "next/server";
import { z } from "zod";

import {
  generatedResumeSchema,
  generateStarterResumeRequestSchema,
  StudentResumeIntake,
} from "@/lib/resume";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = generateStarterResumeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid starter resume payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(buildFallbackResume(parsed.data));
  }

  const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  let response: Response;

  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
          {
            role: "system",
            content:
              "You are a careful resume writer for students and early-career candidates who may not have a resume yet. Turn the supplied facts into a clear starter resume. Do not invent employers, schools, degrees, dates, tools, metrics, awards, shipped outcomes, or responsibilities. If facts are thin, use truthful framing and add review notes instead of making details up. Return only valid JSON.",
          },
          {
            role: "user",
            content: buildPrompt(parsed.data),
          },
        ],
        temperature: 0.35,
        response_format: { type: "json_object" },
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("OpenRouter starter resume request failed.", {
      error: serializeError(error),
    });
    return NextResponse.json(buildFallbackResume(parsed.data));
  }

  const rawPayload = await response.text();
  const payload = parseOpenRouterPayload(rawPayload);

  if (!response.ok) {
    console.warn("OpenRouter starter resume returned a non-OK response.", {
      status: response.status,
      statusText: response.statusText,
      payload,
      rawPayloadPreview: previewText(rawPayload),
    });
    return NextResponse.json(buildFallbackResume(parsed.data));
  }

  const content = payload?.choices?.[0]?.message?.content;
  const generated = generatedResumeSchema.safeParse(parseJsonText(content));

  if (!generated.success) {
    console.warn("OpenRouter returned an unreadable starter resume payload.", {
      schemaErrors: generated.error.flatten(),
      contentPreview: previewText(content),
    });
    return NextResponse.json(buildFallbackResume(parsed.data));
  }

  return NextResponse.json(generated.data);
}

function buildPrompt(request: z.infer<typeof generateStarterResumeRequestSchema>) {
  return `Create a truthful starter resume for a student who does not already have one.

Student facts:
${JSON.stringify(request.intake, null, 2)}

Existing dear[CC] survey summary:
${request.surveySummary || "No survey summary provided."}

Existing profile draft context:
${request.profileDraft ? JSON.stringify(request.profileDraft, null, 2) : "No profile draft provided."}

Rules:
- Use only facts supplied above.
- Prefer concrete bullets from projects, clubs, shipped work, internships, and roles.
- If dates, tools, school names, employers, or outcomes are missing, do not invent them.
- Keep the resume useful for internships and entry-level roles.
- Include review notes for details the student should fill in before sending.

Return JSON with this exact shape:
{
  "resumeText": "complete starter resume in plain text",
  "sectionsUsed": ["Contact", "Education", "Projects"],
  "needsReview": ["Add graduation month/year if you know it"]
}`;
}

function buildFallbackResume(
  request: z.infer<typeof generateStarterResumeRequestSchema>,
): z.infer<typeof generatedResumeSchema> {
  const intake = request.intake;
  const sections: string[] = [];
  const reviewNotes = buildReviewNotes(intake);
  const contactLines = [
    intake.name || "Student Name",
    [intake.email, intake.phone, intake.location].filter(Boolean).join(" | "),
  ].filter(Boolean);
  const projectBullets = [
    ...toBullets(intake.coolProjects),
    ...toBullets(intake.shippedProjects),
  ];
  const clubBullets = toBullets(intake.clubs);
  const internshipBullets = toBullets(intake.internships);
  const fullTimeBullets = toBullets(intake.fullTimeRoles);
  const skillKeywords = inferSkillKeywords([request.surveySummary, intake.coolProjects, intake.shippedProjects]);

  const resumeParts = [contactLines.join("\n")];

  if (request.surveySummary.trim()) {
    sections.push("Summary");
    resumeParts.push(
      [
        "SUMMARY",
        sentenceFromText(
          request.surveySummary,
          "Student and early-career candidate exploring roles that match their projects, strengths, and interests.",
        ),
      ].join("\n"),
    );
  }

  if (intake.degree.trim()) {
    sections.push("Education");
    resumeParts.push(["EDUCATION", intake.degree.trim()].join("\n"));
  }

  if (projectBullets.length > 0) {
    sections.push("Projects");
    resumeParts.push(["PROJECTS", projectBullets.map((item) => `- ${item}`).join("\n")].join("\n"));
  }

  if (clubBullets.length > 0) {
    sections.push("Leadership and Activities");
    resumeParts.push(
      ["LEADERSHIP AND ACTIVITIES", clubBullets.map((item) => `- ${item}`).join("\n")].join("\n"),
    );
  }

  if (internshipBullets.length > 0 || fullTimeBullets.length > 0) {
    sections.push("Experience");
    resumeParts.push(
      [
        "EXPERIENCE",
        [...internshipBullets, ...fullTimeBullets].map((item) => `- ${item}`).join("\n"),
      ].join("\n"),
    );
  }

  if (skillKeywords.length > 0) {
    sections.push("Skills");
    resumeParts.push(["SKILLS", skillKeywords.join(" | ")].join("\n"));
  }

  if (reviewNotes.length > 0) {
    resumeParts.push(["NEXT DETAILS TO ADD", reviewNotes.map((item) => `- ${item}`).join("\n")].join("\n"));
  }

  return {
    resumeText: resumeParts.filter(Boolean).join("\n\n"),
    sectionsUsed: sections.length > 0 ? sections : ["Contact"],
    needsReview: reviewNotes,
  };
}

function buildReviewNotes(intake: StudentResumeIntake) {
  const notes: string[] = [];

  if (!intake.name.trim()) {
    notes.push("Add your full name.");
  }

  if (!intake.email.trim() && !intake.phone.trim()) {
    notes.push("Add at least one way for employers to contact you.");
  }

  if (intake.degree.trim() && !/\b(20\d{2}|spring|summer|fall|winter|expected|graduat)/i.test(intake.degree)) {
    notes.push("Add your graduation date or expected graduation date if you know it.");
  }

  if (!intake.internships.trim() && !intake.fullTimeRoles.trim()) {
    notes.push("Add internships, jobs, campus work, or part-time roles when you have them.");
  }

  if (!intake.shippedProjects.trim()) {
    notes.push("Add any links, users, events, launches, demos, or results for shipped projects.");
  }

  return notes;
}

function toBullets(value: string) {
  return value
    .split(/\r?\n|;/)
    .map((item) => item.trim().replace(/^[-*]\s*/, ""))
    .filter(Boolean)
    .slice(0, 8);
}

function sentenceFromText(value: string, fallback: string) {
  const firstSentence = value
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .find(Boolean);

  return firstSentence || fallback;
}

function inferSkillKeywords(values: string[]) {
  const combined = values.join(" ").toLowerCase();
  const signals = [
    "Research",
    "Data Analysis",
    "Writing",
    "Leadership",
    "Communication",
    "Project Coordination",
    "Customer Support",
    "Design",
    "Programming",
    "Operations",
    "Event Planning",
    "Teamwork",
  ];

  const matched = signals.filter((signal) => combined.includes(signal.toLowerCase().split(" ")[0]));

  return Array.from(new Set([...matched, "Collaboration", "Problem Solving"])).slice(0, 10);
}

function parseOpenRouterPayload(rawPayload: string) {
  if (!rawPayload) {
    return null;
  }

  try {
    return JSON.parse(rawPayload);
  } catch (error) {
    console.warn("OpenRouter returned a response body that was not valid JSON.", {
      error: serializeError(error),
      rawPayloadPreview: previewText(rawPayload),
    });
    return null;
  }
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

function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { message: String(error) };
}

function previewText(text: unknown, maxLength = 1000) {
  if (typeof text !== "string") {
    return text;
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
