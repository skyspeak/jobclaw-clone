import { getDatabaseUrl, getSql } from "@/lib/db";
import { ensureCoreSchema } from "@/lib/database/core-schema";
import { findUserByEmail, upsertUserForPairing } from "@/lib/database/users";

export type GroupRecord = {
  groupId: string;
  name: string | null;
  createdAt: string;
  createdBy: string | null;
  pairingTrack: string | null;
  groupStatus: string;
  memberCount: number;
};

export type GroupMemberRecord = {
  groupId: string;
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  joinedAt: string;
};

export async function syncPairingGroup(input: {
  groupId: string;
  name: string;
  pairingTrack: string;
  groupStatus: string;
  createdAt: string;
  lockedAt: string | null;
  members: Array<{ id: string; name: string; email: string; role?: "owner" | "member" }>;
}): Promise<void> {
  if (!getDatabaseUrl()) {
    return;
  }

  await ensureCoreSchema();
  const sql = getSql();

  await sql`
    insert into groups (
      group_id,
      name,
      created_at,
      pairing_track,
      group_status
    ) values (
      ${input.groupId}::uuid,
      ${input.name},
      ${input.createdAt},
      ${input.pairingTrack},
      ${input.groupStatus}
    )
    on conflict (group_id) do update set
      name = excluded.name,
      pairing_track = excluded.pairing_track,
      group_status = excluded.group_status
  `;

  for (const member of input.members) {
    await upsertUserForPairing({
      email: member.email,
      name: member.name,
      track: input.pairingTrack,
      status: "matched",
      joinedAt: input.createdAt,
      groupId: input.groupId,
    });

    const user = await findUserByEmail(member.email);
    if (!user) {
      continue;
    }

    await sql`
      insert into group_members (group_id, user_id, role, joined_at)
      values (
        ${input.groupId}::uuid,
        ${user.userId}::uuid,
        ${member.role ?? "member"},
        ${input.createdAt}
      )
      on conflict (group_id, user_id) do update set role = excluded.role
    `;
  }
}

export async function listGroups(): Promise<GroupRecord[]> {
  if (!getDatabaseUrl()) {
    return [];
  }

  await ensureCoreSchema();
  const sql = getSql();

  const rows = await sql<
    Array<{
      group_id: string;
      name: string | null;
      created_at: Date | string;
      created_by: string | null;
      pairing_track: string | null;
      group_status: string;
      member_count: number;
    }>
  >`
    select
      g.group_id,
      g.name,
      g.created_at,
      g.created_by,
      g.pairing_track,
      g.group_status,
      count(gm.user_id)::int as member_count
    from groups g
    left join group_members gm on g.group_id = gm.group_id
    group by g.group_id
    order by g.created_at desc
  `;

  return rows.map((row) => ({
    groupId: row.group_id,
    name: row.name,
    createdAt: new Date(row.created_at).toISOString(),
    createdBy: row.created_by,
    pairingTrack: row.pairing_track,
    groupStatus: row.group_status,
    memberCount: row.member_count,
  }));
}

export async function listGroupMembers(groupId?: string): Promise<GroupMemberRecord[]> {
  if (!getDatabaseUrl()) {
    return [];
  }

  await ensureCoreSchema();
  const sql = getSql();

  const rows = groupId
    ? await sql<
        Array<{
          group_id: string;
          user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          role: string;
          joined_at: Date | string;
        }>
      >`
        select
          gm.group_id,
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          gm.role,
          gm.joined_at
        from group_members gm
        join users u on u.user_id = gm.user_id
        where gm.group_id = ${groupId}::uuid
        order by gm.joined_at asc
      `
    : await sql<
        Array<{
          group_id: string;
          user_id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          role: string;
          joined_at: Date | string;
        }>
      >`
        select
          gm.group_id,
          u.user_id,
          u.email,
          u.first_name,
          u.last_name,
          gm.role,
          gm.joined_at
        from group_members gm
        join users u on u.user_id = gm.user_id
        order by gm.joined_at desc
      `;

  return rows.map((row) => ({
    groupId: row.group_id,
    userId: row.user_id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    joinedAt: new Date(row.joined_at).toISOString(),
  }));
}
