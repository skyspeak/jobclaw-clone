import { promises as fs } from "node:fs";
import path from "node:path";

import postgres from "postgres";
import { z } from "zod";

import {
  defaultSearchDefaults,
  generateRequestSchema,
  JobClawResponse,
  SearchDefaults,
} from "@/lib/jobclaw";

export type ContactInfo = {
  raw: string;
  name: string;
  email: string;
  phone: string;
};

export type ProfileAssessment = {
  archetype?: {
    name?: string;
    summary?: string;
  };
  idealJob?: {
    title?: string;
    why?: string;
    adjacentTitles?: string[];
  };
  linkedInProfile?: {
    headline?: string;
    about?: string;
    skills?: string[];
  };
};

export type IntakeSubmission = {
  id: string;
  createdAt: string;
  updatedAt: string;
  contact: ContactInfo;
  answers: z.infer<typeof generateRequestSchema>["answers"];
  defaults: SearchDefaults;
  result: JobClawResponse;
  profileDraft: ProfileAssessment | null;
};

const contactSchema = z.object({
  raw: z.string().optional().default(""),
  name: z.string().optional().default(""),
  email: z.string().optional().default(""),
  phone: z.string().optional().default(""),
});

export const submissionRequestSchema = z.object({
  clientSubmissionId: z.string().optional(),
  contact: contactSchema,
  answers: generateRequestSchema.shape.answers,
  defaults: generateRequestSchema.shape.defaults.optional(),
  result: z.object({
    summary: z.string(),
    searchRequest: z.unknown().nullable(),
  }),
  profileDraft: z.unknown().nullable().optional(),
});

const submissionsFilePath = path.join(process.cwd(), "data", "intake-submissions.json");
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
const isHostedRuntime = Boolean(process.env.VERCEL);
let sqlClient: ReturnType<typeof postgres> | null = null;

type SubmissionRow = {
  id: string;
  created_at: string | Date;
  updated_at: string | Date;
  contact: ContactInfo;
  answers: z.infer<typeof generateRequestSchema>["answers"];
  defaults: SearchDefaults;
  result: JobClawResponse;
  profile_draft: ProfileAssessment | null;
};

export function getSubmissionStoreLabel() {
  if (isHostedRuntime && !databaseUrl) {
    return "Not configured";
  }

  return databaseUrl ? "Postgres database" : "Local JSON fallback";
}

export async function listSubmissions(): Promise<IntakeSubmission[]> {
  if (databaseUrl) {
    return listDatabaseSubmissions();
  }

  const submissions = await readSubmissions();

  return submissions.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function createSubmission(
  request: z.infer<typeof submissionRequestSchema>,
): Promise<IntakeSubmission> {
  const now = new Date().toISOString();
  const submission: IntakeSubmission = {
    id: request.clientSubmissionId || crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    contact: request.contact,
    answers: request.answers,
    defaults: { ...defaultSearchDefaults, ...request.defaults },
    result: request.result as JobClawResponse,
    profileDraft: normalizeProfileDraft(request.profileDraft),
  };

  if (databaseUrl) {
    return upsertDatabaseSubmission(submission);
  }

  if (isHostedRuntime) {
    return submission;
  }

  const submissions = await readSubmissions();
  const existingIndex = request.clientSubmissionId
    ? submissions.findIndex((submission) => submission.id === request.clientSubmissionId)
    : -1;

  if (existingIndex >= 0) {
    submission.createdAt = submissions[existingIndex].createdAt;
  }

  if (existingIndex >= 0) {
    submissions[existingIndex] = submission;
  } else {
    submissions.push(submission);
  }

  await writeSubmissions(submissions);

  return submission;
}

async function listDatabaseSubmissions(): Promise<IntakeSubmission[]> {
  const sql = await getSql();
  const rows = await sql<SubmissionRow[]>`
    select
      id,
      created_at,
      updated_at,
      contact,
      answers,
      defaults,
      result,
      profile_draft
    from intake_submissions
    order by created_at desc
  `;

  return rows.map(mapSubmissionRow);
}

async function upsertDatabaseSubmission(
  submission: IntakeSubmission,
): Promise<IntakeSubmission> {
  const sql = await getSql();
  const rows = await sql<SubmissionRow[]>`
    insert into intake_submissions (
      id,
      created_at,
      updated_at,
      contact,
      answers,
      defaults,
      result,
      profile_draft
    ) values (
      ${submission.id},
      ${submission.createdAt},
      ${submission.updatedAt},
      ${sql.json(submission.contact)},
      ${sql.json(submission.answers)},
      ${sql.json(submission.defaults)},
      ${sql.json(submission.result)},
      ${sql.json(submission.profileDraft)}
    )
    on conflict (id) do update set
      updated_at = excluded.updated_at,
      contact = excluded.contact,
      answers = excluded.answers,
      defaults = excluded.defaults,
      result = excluded.result,
      profile_draft = excluded.profile_draft
    returning
      id,
      created_at,
      updated_at,
      contact,
      answers,
      defaults,
      result,
      profile_draft
  `;

  return mapSubmissionRow(rows[0]);
}

async function getSql() {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or POSTGRES_URL is required for Postgres submissions.");
  }

  sqlClient ??= postgres(databaseUrl, {
    max: 1,
    ssl: databaseUrl.includes("localhost") ? false : "require",
  });

  await ensureSubmissionsTable(sqlClient);

  return sqlClient;
}

async function ensureSubmissionsTable(sql: ReturnType<typeof postgres>) {
  await sql`
    create table if not exists intake_submissions (
      id text primary key,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      contact jsonb not null,
      answers jsonb not null,
      defaults jsonb not null,
      result jsonb not null,
      profile_draft jsonb
    )
  `;
}

function mapSubmissionRow(row: SubmissionRow): IntakeSubmission {
  return {
    id: row.id,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    contact: row.contact,
    answers: row.answers,
    defaults: row.defaults,
    result: row.result,
    profileDraft: row.profile_draft,
  };
}

async function readSubmissions(): Promise<IntakeSubmission[]> {
  try {
    const file = await fs.readFile(submissionsFilePath, "utf8");
    const parsed = JSON.parse(file) as IntakeSubmission[];

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    throw error;
  }
}

async function writeSubmissions(submissions: IntakeSubmission[]) {
  await fs.mkdir(path.dirname(submissionsFilePath), { recursive: true });
  await fs.writeFile(submissionsFilePath, JSON.stringify(submissions, null, 2));
}

function normalizeProfileDraft(profileDraft: unknown): ProfileAssessment | null {
  if (!profileDraft || typeof profileDraft !== "object") {
    return null;
  }

  return profileDraft as ProfileAssessment;
}

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function isMissingFileError(error: unknown) {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
