import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { getDatabaseUrl, getSql } from "@/lib/db";

const submissionsFilePath = path.join(process.cwd(), "data", "job-fit-submissions.json");
const databaseUrl = getDatabaseUrl();
const isHostedRuntime = Boolean(process.env.VERCEL);

export const jobFitSubmissionMetaSchema = z.object({
  inputType: z.enum(["url", "paste", "library"]),
  listingId: z.string().max(100).optional(),
  listingTitle: z.string().max(300).optional(),
  intakeSubmissionId: z.string().max(100).optional(),
  submitterName: z.string().max(200).optional().default(""),
  submitterEmail: z.string().max(320).optional().default(""),
  submitterPhone: z.string().max(80).optional().default(""),
});

export type JobFitSubmissionMeta = z.infer<typeof jobFitSubmissionMetaSchema>;

export type JobFitSubmission = {
  id: string;
  createdAt: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  intakeSubmissionId: string;
  inputType: "url" | "paste" | "library";
  jobUrl: string;
  jobDescription: string;
  listingId: string;
  listingTitle: string;
  roleTitle: string;
  verdict: string;
  resultHeadline: string;
};

type JobFitSubmissionRow = {
  id: string;
  created_at: string | Date;
  submitter_name: string;
  submitter_email: string;
  submitter_phone: string;
  intake_submission_id: string | null;
  input_type: string;
  job_url: string;
  job_description: string;
  listing_id: string | null;
  listing_title: string | null;
  role_title: string | null;
  verdict: string | null;
  result_headline: string | null;
};

export type CreateJobFitSubmissionInput = JobFitSubmissionMeta & {
  jobUrl: string;
  jobDescription: string;
  roleTitle?: string;
  verdict?: string;
  resultHeadline?: string;
};

async function readSubmissionsFile(): Promise<JobFitSubmission[]> {
  try {
    const raw = await fs.readFile(submissionsFilePath, "utf8");
    const parsed = JSON.parse(raw) as JobFitSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSubmissionsFile(submissions: JobFitSubmission[]): Promise<void> {
  await fs.mkdir(path.dirname(submissionsFilePath), { recursive: true });
  await fs.writeFile(submissionsFilePath, JSON.stringify(submissions, null, 2), "utf8");
}

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRow(row: JobFitSubmissionRow): JobFitSubmission {
  return {
    id: row.id,
    createdAt: toIsoString(row.created_at),
    submitterName: row.submitter_name,
    submitterEmail: row.submitter_email,
    submitterPhone: row.submitter_phone,
    intakeSubmissionId: row.intake_submission_id ?? "",
    inputType: row.input_type as JobFitSubmission["inputType"],
    jobUrl: row.job_url,
    jobDescription: row.job_description,
    listingId: row.listing_id ?? "",
    listingTitle: row.listing_title ?? "",
    roleTitle: row.role_title ?? "",
    verdict: row.verdict ?? "",
    resultHeadline: row.result_headline ?? "",
  };
}

async function ensureJobFitSubmissionsTable(sql: ReturnType<typeof getSql>) {
  await sql`
    create table if not exists job_fit_submissions (
      id text primary key,
      created_at timestamptz not null default now(),
      submitter_name text not null default '',
      submitter_email text not null default '',
      submitter_phone text not null default '',
      intake_submission_id text,
      input_type text not null,
      job_url text not null default '',
      job_description text not null,
      listing_id text,
      listing_title text,
      role_title text,
      verdict text,
      result_headline text
    )
  `;
}

export function getJobFitSubmissionsStoreLabel() {
  if (isHostedRuntime && !databaseUrl) {
    return "Not configured";
  }

  return databaseUrl ? "Postgres database" : "Local JSON (data/job-fit-submissions.json)";
}

export async function listJobFitSubmissions(): Promise<JobFitSubmission[]> {
  if (databaseUrl) {
    const sql = getSql();
    await ensureJobFitSubmissionsTable(sql);
    const rows = await sql<JobFitSubmissionRow[]>`
      select
        id,
        created_at,
        submitter_name,
        submitter_email,
        submitter_phone,
        intake_submission_id,
        input_type,
        job_url,
        job_description,
        listing_id,
        listing_title,
        role_title,
        verdict,
        result_headline
      from job_fit_submissions
      order by created_at desc
    `;

    return rows.map(mapRow);
  }

  const submissions = await readSubmissionsFile();
  return submissions.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export async function createJobFitSubmission(
  input: CreateJobFitSubmissionInput,
): Promise<JobFitSubmission> {
  const meta = jobFitSubmissionMetaSchema.parse(input);
  const record: JobFitSubmission = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    submitterName: meta.submitterName.trim(),
    submitterEmail: meta.submitterEmail.trim(),
    submitterPhone: meta.submitterPhone.trim(),
    intakeSubmissionId: meta.intakeSubmissionId?.trim() ?? "",
    inputType: meta.inputType,
    jobUrl: input.jobUrl.trim().slice(0, 2000),
    jobDescription: input.jobDescription.trim().slice(0, 50_000),
    listingId: meta.listingId?.trim() ?? "",
    listingTitle: meta.listingTitle?.trim() ?? "",
    roleTitle: input.roleTitle?.trim() ?? "",
    verdict: input.verdict?.trim() ?? "",
    resultHeadline: input.resultHeadline?.trim() ?? "",
  };

  if (databaseUrl) {
    const sql = getSql();
    await ensureJobFitSubmissionsTable(sql);
    const rows = await sql<JobFitSubmissionRow[]>`
      insert into job_fit_submissions (
        id,
        created_at,
        submitter_name,
        submitter_email,
        submitter_phone,
        intake_submission_id,
        input_type,
        job_url,
        job_description,
        listing_id,
        listing_title,
        role_title,
        verdict,
        result_headline
      ) values (
        ${record.id},
        ${record.createdAt},
        ${record.submitterName},
        ${record.submitterEmail},
        ${record.submitterPhone},
        ${record.intakeSubmissionId || null},
        ${record.inputType},
        ${record.jobUrl},
        ${record.jobDescription},
        ${record.listingId || null},
        ${record.listingTitle || null},
        ${record.roleTitle || null},
        ${record.verdict || null},
        ${record.resultHeadline || null}
      )
      returning
        id,
        created_at,
        submitter_name,
        submitter_email,
        submitter_phone,
        intake_submission_id,
        input_type,
        job_url,
        job_description,
        listing_id,
        listing_title,
        role_title,
        verdict,
        result_headline
    `;

    return mapRow(rows[0]);
  }

  if (isHostedRuntime) {
    return record;
  }

  const existing = await readSubmissionsFile();
  existing.push(record);
  await writeSubmissionsFile(existing);
  return record;
}

export function inputTypeLabel(inputType: JobFitSubmission["inputType"]) {
  switch (inputType) {
    case "url":
      return "URL";
    case "library":
      return "Library";
    case "paste":
      return "Pasted text";
  }
}
