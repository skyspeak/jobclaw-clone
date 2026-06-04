import { getDatabaseUrl, getSql } from "@/lib/db";
import {
  findCandidateByEmail,
  markCandidateConverted,
  type CandidateRecord,
} from "@/lib/database/candidates";
import { splitFullName } from "@/lib/database/names";
import { ensureCoreSchema } from "@/lib/database/core-schema";

export type UserRecord = {
  userId: string;
  email: string;
  phone: string | null;
  linkedinUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
  candidateId: string | null;
  sprintTrackId: string | null;
  sprintTrackTitle: string | null;
  sprintCommittedAt: string | null;
  sprintFinishDate: string | null;
  pairingTrack: string | null;
  pairingStatus: string | null;
  pairingJoinedAt: string | null;
  pairingGroupId: string | null;
};

type UserRow = {
  user_id: string;
  email: string;
  phone: string | null;
  linkedin_url: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: Date | string;
  candidate_id: string | null;
  sprint_track_id: string | null;
  sprint_track_title: string | null;
  sprint_committed_at: Date | string | null;
  sprint_finish_date: Date | string | null;
  pairing_track: string | null;
  pairing_status: string | null;
  pairing_joined_at: Date | string | null;
  pairing_group_id: string | null;
};

function mapRow(row: UserRow): UserRecord {
  return {
    userId: row.user_id,
    email: row.email,
    phone: row.phone,
    linkedinUrl: row.linkedin_url,
    firstName: row.first_name,
    lastName: row.last_name,
    createdAt: new Date(row.created_at).toISOString(),
    candidateId: row.candidate_id,
    sprintTrackId: row.sprint_track_id,
    sprintTrackTitle: row.sprint_track_title,
    sprintCommittedAt: row.sprint_committed_at
      ? new Date(row.sprint_committed_at).toISOString()
      : null,
    sprintFinishDate: row.sprint_finish_date
      ? new Date(row.sprint_finish_date).toISOString()
      : null,
    pairingTrack: row.pairing_track,
    pairingStatus: row.pairing_status,
    pairingJoinedAt: row.pairing_joined_at
      ? new Date(row.pairing_joined_at).toISOString()
      : null,
    pairingGroupId: row.pairing_group_id,
  };
}

async function recordConversion(candidate: CandidateRecord, userId: string, source: string) {
  const sql = getSql();
  const conversionId = crypto.randomUUID();

  const existing = await sql<{ conversion_id: string }[]>`
    select conversion_id from candidate_conversions
    where candidate_id = ${candidate.candidateId}::uuid and user_id = ${userId}::uuid
    limit 1
  `;

  if (existing.length === 0) {
    await sql`
      insert into candidate_conversions (
        conversion_id,
        candidate_id,
        user_id,
        conversion_source
      ) values (
        ${conversionId}::uuid,
        ${candidate.candidateId}::uuid,
        ${userId}::uuid,
        ${source}
      )
    `;
  }

  await markCandidateConverted(candidate.candidateId);
}

export async function upsertUserFromCommit(input: {
  email: string;
  name: string;
  phone: string;
  trackId: string;
  trackTitle: string;
  finishDate: string;
  linkedinUrl?: string | null;
  conversionSource?: string;
}): Promise<UserRecord | null> {
  if (!getDatabaseUrl()) {
    return null;
  }

  await ensureCoreSchema();
  const sql = getSql();
  const email = input.email.trim().toLowerCase();
  const { firstName, lastName } = splitFullName(input.name);
  const candidate = await findCandidateByEmail(email);
  const userId = crypto.randomUUID();
  const committedAt = new Date().toISOString();

  const rows = await sql<UserRow[]>`
    insert into users (
      user_id,
      email,
      phone,
      linkedin_url,
      first_name,
      last_name,
      candidate_id,
      sprint_track_id,
      sprint_track_title,
      sprint_committed_at,
      sprint_finish_date
    ) values (
      ${userId}::uuid,
      ${email},
      ${input.phone.trim()},
      ${input.linkedinUrl?.trim() || null},
      ${firstName || null},
      ${lastName || null},
      ${candidate?.candidateId ?? null}::uuid,
      ${input.trackId},
      ${input.trackTitle},
      ${committedAt},
      ${input.finishDate}
    )
    on conflict (email) do update set
      phone = excluded.phone,
      linkedin_url = coalesce(excluded.linkedin_url, users.linkedin_url),
      first_name = coalesce(nullif(excluded.first_name, ''), users.first_name),
      last_name = coalesce(nullif(excluded.last_name, ''), users.last_name),
      candidate_id = coalesce(users.candidate_id, excluded.candidate_id),
      sprint_track_id = excluded.sprint_track_id,
      sprint_track_title = excluded.sprint_track_title,
      sprint_committed_at = excluded.sprint_committed_at,
      sprint_finish_date = excluded.sprint_finish_date
    returning *
  `;

  const user = mapRow(rows[0]);

  if (candidate && candidate.status === "active") {
    await recordConversion(candidate, user.userId, input.conversionSource ?? "sprint_commitment");
    await sql`
      update users set candidate_id = ${candidate.candidateId}::uuid where user_id = ${user.userId}::uuid
    `;
  }

  return user;
}

export async function upsertUserForPairing(input: {
  email: string;
  name: string;
  track: string;
  status: string;
  joinedAt: string;
  groupId: string | null;
}): Promise<UserRecord | null> {
  if (!getDatabaseUrl()) {
    return null;
  }

  await ensureCoreSchema();
  const sql = getSql();
  const email = input.email.trim().toLowerCase();
  const { firstName, lastName } = splitFullName(input.name);
  const userId = crypto.randomUUID();

  const rows = await sql<UserRow[]>`
    insert into users (
      user_id,
      email,
      first_name,
      last_name,
      pairing_track,
      pairing_status,
      pairing_joined_at,
      pairing_group_id
    ) values (
      ${userId}::uuid,
      ${email},
      ${firstName || null},
      ${lastName || null},
      ${input.track},
      ${input.status},
      ${input.joinedAt},
      ${input.groupId}::uuid
    )
    on conflict (email) do update set
      first_name = coalesce(nullif(excluded.first_name, ''), users.first_name),
      last_name = coalesce(nullif(excluded.last_name, ''), users.last_name),
      pairing_track = excluded.pairing_track,
      pairing_status = excluded.pairing_status,
      pairing_joined_at = excluded.pairing_joined_at,
      pairing_group_id = excluded.pairing_group_id
    returning *
  `;

  return mapRow(rows[0]);
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  if (!getDatabaseUrl()) {
    return null;
  }

  await ensureCoreSchema();
  const sql = getSql();
  const rows = await sql<UserRow[]>`
    select * from users where email = ${email.trim().toLowerCase()} limit 1
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  if (!getDatabaseUrl()) {
    return null;
  }

  await ensureCoreSchema();
  const sql = getSql();
  const rows = await sql<UserRow[]>`
    select * from users where user_id = ${userId}::uuid limit 1
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function listUsers(): Promise<UserRecord[]> {
  if (!getDatabaseUrl()) {
    return [];
  }

  await ensureCoreSchema();
  const sql = getSql();
  const rows = await sql<UserRow[]>`
    select * from users order by coalesce(sprint_committed_at, created_at) desc
  `;

  return rows.map(mapRow);
}
