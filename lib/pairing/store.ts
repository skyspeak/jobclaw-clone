import { promises as fs } from "node:fs";
import path from "node:path";

import { PAIRING_MATCHER_INTERVAL_MS } from "@/lib/pairing/constants";
import { runMatcherForAllTracks } from "@/lib/pairing/matcher";
import type {
  PairingGroup,
  PairingMemberPublic,
  PairingStatusResponse,
  PairingStoreData,
  PairingTrack,
  PairingUser,
  UserStatus,
} from "@/lib/pairing/types";

const storePath = path.join(process.cwd(), "data", "pairing.json");
const isHostedRuntime = Boolean(process.env.VERCEL);

type GlobalPairingCache = {
  data: PairingStoreData;
  loaded: boolean;
};

const globalKey = "__jobclaw_pairing_store__";

function emptyStore(): PairingStoreData {
  return { users: [], groups: [], lastMatcherRunAt: null };
}

function getCache(): GlobalPairingCache {
  const g = globalThis as typeof globalThis & { [key: string]: GlobalPairingCache | undefined };
  if (!g[globalKey]) {
    g[globalKey] = { data: emptyStore(), loaded: false };
  }
  return g[globalKey];
}

async function readFileStore(): Promise<PairingStoreData> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as PairingStoreData;
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      groups: Array.isArray(parsed.groups) ? parsed.groups : [],
      lastMatcherRunAt: parsed.lastMatcherRunAt ?? null,
    };
  } catch {
    return emptyStore();
  }
}

async function writeFileStore(data: PairingStoreData): Promise<void> {
  if (isHostedRuntime) {
    return;
  }
  await fs.mkdir(path.dirname(storePath), { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(data, null, 2), "utf8");
}

async function loadStore(): Promise<PairingStoreData> {
  const cache = getCache();
  if (!cache.loaded) {
    cache.data = await readFileStore();
    cache.loaded = true;
  }
  return cache.data;
}

async function saveStore(data: PairingStoreData): Promise<void> {
  const cache = getCache();
  cache.data = data;
  cache.loaded = true;
  await writeFileStore(data);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function shouldRunMatcher(data: PairingStoreData): boolean {
  if (!data.lastMatcherRunAt) {
    return true;
  }
  const elapsed = Date.now() - new Date(data.lastMatcherRunAt).getTime();
  return elapsed >= PAIRING_MATCHER_INTERVAL_MS;
}

async function maybeRunMatcher(data: PairingStoreData): Promise<PairingStoreData> {
  if (!shouldRunMatcher(data)) {
    return data;
  }
  const { users, groups } = runMatcherForAllTracks(data.users, data.groups);
  return {
    users,
    groups,
    lastMatcherRunAt: new Date().toISOString(),
  };
}

function getWaitingInTrack(users: PairingUser[], track: PairingTrack): PairingUser[] {
  return users
    .filter((u) => u.track === track && u.status === "waiting")
    .sort(
      (a, b) =>
        new Date(a.joinedQueueAt).getTime() - new Date(b.joinedQueueAt).getTime(),
    );
}

function queuePosition(users: PairingUser[], user: PairingUser): number {
  const waiting = getWaitingInTrack(users, user.track);
  const index = waiting.findIndex((u) => u.id === user.id);
  return index < 0 ? waiting.length : index + 1;
}

function membersForGroup(
  users: PairingUser[],
  group: PairingGroup,
): PairingMemberPublic[] {
  return group.memberIds
    .map((id) => users.find((u) => u.id === id))
    .filter((u): u is PairingUser => Boolean(u))
    .map((u) => ({ id: u.id, name: u.name, email: u.email }));
}

export async function registerPairingUser(input: {
  name: string;
  email: string;
  track: PairingTrack;
}): Promise<{ user: PairingUser; created: boolean }> {
  let data = await loadStore();
  const email = normalizeEmail(input.email);
  const existing = data.users.find((u) => normalizeEmail(u.email) === email);

  if (existing) {
    const now = new Date().toISOString();
    let refreshed: PairingUser = {
      ...existing,
      name: input.name.trim() || existing.name,
      lastSeenAt: now,
    };

    if (existing.status === "matched") {
      refreshed = { ...refreshed, track: existing.track };
      data.users = data.users.map((u) => (u.id === refreshed.id ? refreshed : u));
      await saveStore(data);
      return { user: refreshed, created: false };
    }

    if (existing.status === "inactive") {
      refreshed = {
        ...refreshed,
        track: input.track,
        status: "waiting",
        groupId: null,
        joinedQueueAt: now,
      };
    } else {
      refreshed = {
        ...refreshed,
        track: input.track,
        status: "waiting",
      };
    }

    data.users = data.users.map((u) => (u.id === refreshed.id ? refreshed : u));
    data = runMatcherOnRegister(data);
    await saveStore(data);
    const user = data.users.find((u) => u.id === refreshed.id) ?? refreshed;
    return { user, created: false };
  }

  const now = new Date().toISOString();
  const user: PairingUser = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: input.email.trim(),
    track: input.track,
    status: "waiting",
    joinedQueueAt: now,
    groupId: null,
    lastSeenAt: now,
  };

  data.users.push(user);
  data = runMatcherOnRegister(data);
  await saveStore(data);
  const saved = data.users.find((u) => u.id === user.id) ?? user;
  return { user: saved, created: true };
}

function runMatcherOnRegister(data: PairingStoreData): PairingStoreData {
  const { users, groups } = runMatcherForAllTracks(data.users, data.groups);
  return {
    users,
    groups,
    lastMatcherRunAt: new Date().toISOString(),
  };
}

export async function touchPairingUser(userId: string): Promise<void> {
  let data = await loadStore();
  const now = new Date().toISOString();
  data.users = data.users.map((u) =>
    u.id === userId ? { ...u, lastSeenAt: now } : u,
  );
  data = await maybeRunMatcher(data);
  await saveStore(data);
}

export async function getPairingStatus(userId: string): Promise<PairingStatusResponse | null> {
  let data = await loadStore();
  data = await maybeRunMatcher(data);
  await saveStore(data);

  const user = data.users.find((u) => u.id === userId);
  if (!user) {
    return null;
  }

  if (user.status === "inactive") {
    return {
      status: "inactive",
      groupId: user.groupId,
      track: user.track,
    };
  }

  if (user.status === "matched" && user.groupId) {
    const group = data.groups.find((g) => g.id === user.groupId);
    if (!group) {
      return {
        status: "waiting",
        groupId: null,
        track: user.track,
        queuePosition: queuePosition(data.users, user),
        waitingInTrack: getWaitingInTrack(data.users, user.track).length,
      };
    }
    return {
      status: "matched",
      groupId: group.id,
      track: user.track,
      members: membersForGroup(data.users, group),
      lockedAt: group.lockedAt ?? group.createdAt,
    };
  }

  const waiting = getWaitingInTrack(data.users, user.track);
  return {
    status: "waiting",
    groupId: null,
    track: user.track,
    queuePosition: queuePosition(data.users, user),
    waitingInTrack: waiting.length,
  };
}

export async function markPairingUserInactive(userId: string): Promise<void> {
  let data = await loadStore();
  data.users = data.users.map((u) =>
    u.id === userId && u.status === "waiting"
      ? { ...u, status: "inactive" as UserStatus, groupId: null }
      : u,
  );
  await saveStore(data);
}
