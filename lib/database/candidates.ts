import { getDatabaseUrl, getSql } from "@/lib/db";
import { splitFullName } from "@/lib/database/names";
import { ensureCoreSchema } from "@/lib/database/core-schema";

export type CandidateStatus = "active" | "converted" | "disqualified";

export type CandidateRecord = {
  candidateId: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  convertedAt: string | null;
  status: CandidateStatus;
};

type CandidateRow = {
  candidate_id: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: Date | string;
  converted_at: Date | string | null;
  status: CandidateStatus;
};

function mapRow(row: CandidateRow): CandidateRecord {
  return {
    candidateId: row.candidate_id,
    email: row.email,
    phone: row.phone,
    linkedinUrl: row.linkedin_url,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: new Date(row.created_at).toISOString(),
    convertedAt: row.converted_at ? new Date(row.converted_at).toISOString() : null,
    status: row.status,
  };
}

export async function upsertCandidate(input: {
  email: string;
  name?: string;
  phone?: string | null;
  linkedinUrl?: string | null;
}): Promise<CandidateRecord | null> {
  if (!getDatabaseUrl()) {
    return null;
  }

  await ensureCoreSchema();
  const sql = getSql();
  const email = input.email.trim().toLowerCase();
  const { firstName, lastName } = splitFullName(input.name ?? "");
  const candidateId = crypto.randomUUID();

  const rows = await sql<CandidateRow[]>`
    insert into candidates (
      candidate_id,
      email,
      phone,
      linkedin_url,
      first_name,
      last_name,
      status
    ) values (
      ${candidateId}::uuid,
      ${email},
      ${input.phone?.trim() || null},
      ${input.linkedinUrl?.trim() || null},
      ${firstName || null},
      ${lastName || null},
      'active'
    )
    on conflict (email) do update set
      phone = coalesce(excluded.phone, candidates.phone),
      linkedin_url = coalesce(excluded.linkedin_url, candidates.linkedin_url),
      first_name = coalesce(nullif(excluded.first_name, ''), candidates.first_name),
      last_name = coalesce(nullif(excluded.last_name, ''), candidates.last_name)
    returning *
  `;

  return mapRow(rows[0]);
}

export async function findCandidateByEmail(email: string): Promise<CandidateRecord | null> {
  if (!getDatabaseUrl()) {
    return null;
  }

  await ensureCoreSchema();
  const sql = getSql();
  const rows = await sql<CandidateRow[]>`
    select * from candidates where email = ${email.trim().toLowerCase()} limit 1
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function markCandidateConverted(
  candidateId: string,
  convertedAt: string = new Date().toISOString(),
): Promise<void> {
  if (!getDatabaseUrl()) {
    return;
  }

  await ensureCoreSchema();
  const sql = getSql();
  await sql`
    update candidates
    set status = 'converted', converted_at = ${convertedAt}
    where candidate_id = ${candidateId}::uuid
  `;
}

export async function listCandidates(): Promise<CandidateRecord[]> {
  if (!getDatabaseUrl()) {
    return [];
  }

  await ensureCoreSchema();
  const sql = getSql();
  const rows = await sql<CandidateRow[]>`
    select * from candidates order by created_at desc
  `;

  return rows.map(mapRow);
}
