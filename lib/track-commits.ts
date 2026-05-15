import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

const commitsFilePath = path.join(process.cwd(), "data", "track-commits.json");
const isHostedRuntime = Boolean(process.env.VERCEL);

export const trackCommitRequestSchema = z.object({
  trackId: z.string().min(1),
  trackTitle: z.string().min(1),
  phone: z.string().min(1).max(40),
});

export type TrackCommitRecord = {
  id: string;
  createdAt: string;
  trackId: string;
  trackTitle: string;
  phone: string;
  finishDate: string;
};

async function readCommits(): Promise<TrackCommitRecord[]> {
  try {
    const raw = await fs.readFile(commitsFilePath, "utf8");
    const parsed = JSON.parse(raw) as TrackCommitRecord[];
    return Array.isArray(parsed) ? parsed : [];
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
    phone: input.phone.trim(),
    finishDate: input.finishDate,
  };

  if (isHostedRuntime) {
    return record;
  }

  const existing = await readCommits();
  existing.push(record);
  await writeCommits(existing);

  return record;
}
