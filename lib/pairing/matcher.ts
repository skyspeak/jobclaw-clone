import {
  PAIRING_MAX_GROUP_SIZE,
  PAIRING_MIN_GROUP_SIZE,
  PAIRING_TIMEOUT_MS,
} from "@/lib/pairing/constants";
import type { PairingGroup, PairingTrack, PairingUser } from "@/lib/pairing/types";

function ageMs(user: PairingUser, now: number): number {
  return now - new Date(user.joinedQueueAt).getTime();
}

function createGroupId(): string {
  return crypto.randomUUID();
}

function lockGroup(
  track: PairingTrack,
  batch: PairingUser[],
  now: string,
): { group: PairingGroup; updatedUsers: PairingUser[] } {
  const group: PairingGroup = {
    id: createGroupId(),
    track,
    memberIds: batch.map((u) => u.id),
    status: "locked",
    createdAt: now,
    lockedAt: now,
  };

  const updatedUsers = batch.map((u) => ({
    ...u,
    status: "matched" as const,
    groupId: group.id,
  }));

  return { group, updatedUsers };
}

export function matchTrack(
  track: PairingTrack,
  waitingUsers: PairingUser[],
  now: number,
  nowIso: string,
): { groups: PairingGroup[]; users: PairingUser[] } {
  const queue = waitingUsers
    .filter((u) => u.track === track && u.status === "waiting")
    .sort(
      (a, b) =>
        new Date(a.joinedQueueAt).getTime() - new Date(b.joinedQueueAt).getTime(),
    );

  const newGroups: PairingGroup[] = [];
  const userUpdates = new Map<string, PairingUser>();
  let remaining = [...queue];

  while (remaining.length >= PAIRING_MAX_GROUP_SIZE) {
    const batch = remaining.splice(0, PAIRING_MAX_GROUP_SIZE);
    const { group, updatedUsers } = lockGroup(track, batch, nowIso);
    newGroups.push(group);
    for (const u of updatedUsers) {
      userUpdates.set(u.id, u);
    }
  }

  const stale = remaining.filter((u) => ageMs(u, now) >= PAIRING_TIMEOUT_MS);
  if (stale.length >= PAIRING_MIN_GROUP_SIZE) {
    const { group, updatedUsers } = lockGroup(track, stale, nowIso);
    newGroups.push(group);
    for (const u of updatedUsers) {
      userUpdates.set(u.id, u);
    }
    const staleIds = new Set(stale.map((u) => u.id));
    remaining = remaining.filter((u) => !staleIds.has(u.id));
  }

  const users = waitingUsers.map((u) => userUpdates.get(u.id) ?? u);
  return { groups: newGroups, users };
}

export function runMatcherForAllTracks(
  users: PairingUser[],
  groups: PairingGroup[],
): { users: PairingUser[]; groups: PairingGroup[] } {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  let nextUsers = users;
  let nextGroups = [...groups];

  for (const track of ["marketing", "sales", "fde"] as PairingTrack[]) {
    const result = matchTrack(track, nextUsers, now, nowIso);
    nextUsers = result.users;
    nextGroups = [...nextGroups, ...result.groups];
  }

  return { users: nextUsers, groups: nextGroups };
}
