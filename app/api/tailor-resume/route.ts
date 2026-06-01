import { NextResponse } from "next/server";
import { z } from "zod";

const selectedJobSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  keywords: z.array(z.string()).default([]),
  description: z.string().optional().default(""),
});

const tailorResumeRequestSchema = z.object({
  email: z.string().email(),
  resumeText: z.string().min(200).max(40000),
  surveySummary: z.string().optional().default(""),
  selectedJobs: z.array(selectedJobSchema).min(1).max(3),
});

const tailoredResumeSchema = z.object({
  email: z.string(),
  results: z.array(
    z.object({
      jobId: z.string(),
      jobTitle: z.string(),
      requiredSkills: z.array(z.string()),
      matchedSkills: z.array(z.string()),
      missingSkills: z.array(z.string()),
      tailoredResume: z.string(),
      coverNote: z.string(),
    }),
  ),
});

export type TailoredResumeResponse = z.infer<typeof tailoredResumeSchema>;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = tailorResumeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid resume tailoring payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(buildFallbackTailoring(parsed.data));
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
              "You are a careful resume editor for students and early-career candidates. Identify skills required by each target job, then tailor the supplied resume without inventing employers, degrees, dates, certifications, metrics, or tools that are not supported by the resume or survey context. You may reframe and reorder existing evidence. Return only valid JSON.",
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
    console.error("OpenRouter resume tailoring request failed.", {
      error: serializeError(error),
      selectedJobCount: parsed.data.selectedJobs.length,
    });
    return NextResponse.json(buildFallbackTailoring(parsed.data));
  }

  const rawPayload = await response.text();
  const payload = parseOpenRouterPayload(rawPayload);

  if (!response.ok) {
    console.warn("OpenRouter resume tailoring returned a non-OK response.", {
      status: response.status,
      statusText: response.statusText,
      selectedJobCount: parsed.data.selectedJobs.length,
      payload,
      rawPayloadPreview: previewText(rawPayload),
    });
    return NextResponse.json(buildFallbackTailoring(parsed.data));
  }

  const content = payload?.choices?.[0]?.message?.content;
  const tailored = tailoredResumeSchema.safeParse(parseJsonText(content));

  if (!tailored.success) {
    console.warn("OpenRouter returned an unreadable tailored resume payload.", {
      selectedJobCount: parsed.data.selectedJobs.length,
      schemaErrors: tailored.error.flatten(),
      contentPreview: previewText(content),
    });
    return NextResponse.json(buildFallbackTailoring(parsed.data));
  }

  return NextResponse.json(tailored.data);
}

function buildPrompt(request: z.infer<typeof tailorResumeRequestSchema>) {
  return `Tailor this student's resume to each selected job.

Student email:
${request.email}

Completed survey summary:
${request.surveySummary || "No survey summary provided."}

Selected jobs:
${JSON.stringify(request.selectedJobs, null, 2)}

Original resume:
${request.resumeText}

Return JSON with this exact shape:
{
  "email": "${request.email}",
  "results": [
    {
      "jobId": "matching selected job id",
      "jobTitle": "matching selected job title",
      "requiredSkills": ["8-12 skills required for this job"],
      "matchedSkills": ["skills clearly supported by the resume or survey"],
      "missingSkills": ["important skills not clearly supported; phrase as learning targets"],
      "tailoredResume": "complete tailored resume text, preserving truthful details and using placeholders only when the original resume lacks contact info",
      "coverNote": "short first-person note the student can adapt for an application"
    }
  ]
}`;
}

function buildFallbackTailoring(
  request: z.infer<typeof tailorResumeRequestSchema>,
): TailoredResumeResponse {
  const resumeLines = request.resumeText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const resumePreview = resumeLines.slice(0, 18).join("\n");

  return {
    email: request.email,
    results: request.selectedJobs.map((job) => {
      const requiredSkills = inferRequiredSkills(job);
      const matchedSkills = requiredSkills.filter((skill) =>
        request.resumeText.toLowerCase().includes(skill.toLowerCase()),
      );

      return {
        jobId: job.id,
        jobTitle: job.title,
        requiredSkills,
        matchedSkills: matchedSkills.length > 0 ? matchedSkills : requiredSkills.slice(0, 3),
        missingSkills: requiredSkills.filter((skill) => !matchedSkills.includes(skill)).slice(0, 5),
        tailoredResume: [
          `${request.email}`,
          "",
          `TARGET ROLE: ${job.title}`,
          "",
          "SUMMARY",
          `Early-career candidate targeting ${job.title} roles. Brings transferable strengths from the uploaded resume and survey context, with emphasis on ${requiredSkills.slice(0, 3).join(", ")}.`,
          "",
          "RELEVANT SKILLS",
          requiredSkills.map((skill) => `- ${skill}`).join("\n"),
          "",
          "EXPERIENCE AND PROJECTS TO EMPHASIZE",
          resumePreview || "Add resume experience here, then emphasize projects and responsibilities that connect to the target role.",
        ].join("\n"),
        coverNote: `I am interested in the ${job.title} role because it connects to the work style and strengths I described in my dear[CC] survey. I would emphasize ${requiredSkills.slice(0, 3).join(", ")} and use my resume to show evidence for those skills.`,
      };
    }),
  };
}

function inferRequiredSkills(job: z.infer<typeof selectedJobSchema>) {
  const baseSkills = [
    "Communication",
    "Organization",
    "Problem Solving",
    "Collaboration",
    "Learning Agility",
  ];
  const keywordSkills = job.keywords
    .map((keyword) => titleCase(keyword.replace(/[-_]/g, " ")))
    .filter(Boolean);
  const descriptionSkills = [
    "Customer Support",
    "Research",
    "Data Analysis",
    "Project Coordination",
    "Writing",
    "Operations",
    "Program Support",
  ].filter((skill) => job.description.toLowerCase().includes(skill.toLowerCase()));

  return Array.from(new Set([...keywordSkills, ...descriptionSkills, ...baseSkills])).slice(0, 12);
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

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function previewText(text: unknown, maxLength = 1000) {
  if (typeof text !== "string") {
    return text;
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
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
