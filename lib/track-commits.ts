import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { getDatabaseUrl } from "@/lib/db";
import { upsertUserFromCommit } from "@/lib/database/users";

const commitsFilePath = path.join(process.cwd(), "data", "track-commits.json");
const isHostedRuntime = Boolean(process.env.VERCEL);

export const trackCommitRequestSchema = z.object({
  trackId: z.string().min(1),
  trackTitle: z.string().min(1),
  name: z.string().min(1).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(1).max(40),
});

export type TrackCommitRecord = {
  id: string;
  createdAt: string;
  trackId: string;
  trackTitle: string;
  name: string;
  email: string;
  phone: string;
  finishDate: string;
};

export type TrackCommitAdminRow = TrackCommitRecord & {
  linkedIn: string | null;
};

export function getTrackCommitsStoreLabel(): string {
  if (getDatabaseUrl()) {
    return "Postgres users table (+ JSON backup when not on Vercel)";
  }
  return isHostedRuntime
    ? "ephemeral (hosted — not persisted to disk)"
    : "local file (data/track-commits.json)";
}

async function readCommits(): Promise<TrackCommitRecord[]> {
  try {
    const raw = await fs.readFile(commitsFilePath, "utf8");
    const parsed = JSON.parse(raw) as TrackCommitRecord[];
    return Array.isArray(parsed) ? parsed.map(normalizeCommitRecord) : [];
  } catch {
    return [];
  }
}

async function writeCommits(records: TrackCommitRecord[]): Promise<void> {
  await fs.mkdir(path.dirname(commitsFilePath), { recursive: true });
  await fs.writeFile(commitsFilePath, JSON.stringify(records, null, 2), "utf8");
}

export async function createTrackCommit(
  input: z.infer<typeof trackCommitRequestSchema> & { finishDate: string },
): Promise<TrackCommitRecord> {
  const record: TrackCommitRecord = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    trackId: input.trackId,
    trackTitle: input.trackTitle,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    phone: input.phone.trim(),
    finishDate: input.finishDate,
  };

  void upsertUserFromCommit({
    email: input.email,
    name: input.name,
    phone: input.phone,
    trackId: input.trackId,
    trackTitle: input.trackTitle,
    finishDate: input.finishDate,
    conversionSource: "sprint_commitment",
  });

  if (isHostedRuntime) {
    return record;
  }

  const existing = await readCommits();
  existing.push(record);
  await writeCommits(existing);

  return record;
}

export async function listTrackCommits(): Promise<TrackCommitRecord[]> {
  const records = await readCommits();
  return records.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function normalizeCommitRecord(raw: TrackCommitRecord): TrackCommitRecord {
  return {
    ...raw,
    name: typeof raw.name === "string" ? raw.name : "",
    email: raw.email.trim().toLowerCase(),
  };
}
