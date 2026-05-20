import { promises as fs } from "node:fs";
import path from "node:path";

import { z } from "zod";

import { getDatabaseUrl, getSql as getSharedSql } from "@/lib/db";

const listingsFilePath = path.join(process.cwd(), "data", "job-listings.json");
const databaseUrl = getDatabaseUrl();
const isHostedRuntime = Boolean(process.env.VERCEL);

export const jobListingInputSchema = z.object({
  title: z.string().min(1).max(200),
  company: z.string().max(200).optional().default(""),
  location: z.string().max(200).optional().default(""),
  sourceUrl: z.string().max(2000).optional().default(""),
  description: z.string().min(80).max(50_000),
  active: z.boolean().optional().default(true),
});

export const jobListingUpdateSchema = jobListingInputSchema.partial();

export type JobListing = {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  company: string;
  location: string;
  sourceUrl: string;
  description: string;
  active: boolean;
};

type JobListingRow = {
  id: string;
  created_at: string | Date;
  updated_at: string | Date;
  title: string;
  company: string;
  location: string;
  source_url: string;
  description: string;
  active: boolean;
};

async function readListingsFile(): Promise<JobListing[]> {
  try {
    const raw = await fs.readFile(listingsFilePath, "utf8");
    const parsed = JSON.parse(raw) as JobListing[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeListingsFile(listings: JobListing[]): Promise<void> {
  await fs.mkdir(path.dirname(listingsFilePath), { recursive: true });
  await fs.writeFile(listingsFilePath, JSON.stringify(listings, null, 2), "utf8");
}

export function getJobListingsStoreLabel() {
  if (isHostedRuntime && !databaseUrl) {
    return "Not configured";
  }

  return databaseUrl ? "Postgres database" : "Local JSON (data/job-listings.json)";
}

function sortListings(listings: JobListing[]): JobListing[] {
  return [...listings].sort(
    (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
  );
}

function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapJobListingRow(row: JobListingRow): JobListing {
  return {
    id: row.id,
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    title: row.title,
    company: row.company,
    location: row.location,
    sourceUrl: row.source_url,
    description: row.description,
    active: row.active,
  };
}

async function getSql() {
  const sql = getSharedSql();
  await ensureJobListingsTable(sql);
  return sql;
}

async function ensureJobListingsTable(sql: ReturnType<typeof getSharedSql>) {
  await sql`
    create table if not exists job_listings (
      id text primary key,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      title text not null,
      company text not null default '',
      location text not null default '',
      source_url text not null default '',
      description text not null,
      active boolean not null default true
    )
  `;
}

async function listDatabaseJobListings(includeInactive: boolean): Promise<JobListing[]> {
  const sql = await getSql();
  const rows = includeInactive
    ? await sql<JobListingRow[]>`
        select
          id,
          created_at,
          updated_at,
          title,
          company,
          location,
          source_url,
          description,
          active
        from job_listings
        order by updated_at desc
      `
    : await sql<JobListingRow[]>`
        select
          id,
          created_at,
          updated_at,
          title,
          company,
          location,
          source_url,
          description,
          active
        from job_listings
        where active = true
        order by updated_at desc
      `;

  return rows.map(mapJobListingRow);
}

export async function listJobListings(options?: { includeInactive?: boolean }): Promise<JobListing[]> {
  const includeInactive = options?.includeInactive ?? false;

  if (databaseUrl) {
    return listDatabaseJobListings(includeInactive);
  }

  const listings = sortListings(await readListingsFile());
  if (includeInactive) {
    return listings;
  }
  return listings.filter((listing) => listing.active);
}

export async function getJobListingById(id: string): Promise<JobListing | null> {
  if (databaseUrl) {
    const sql = await getSql();
    const rows = await sql<JobListingRow[]>`
      select
        id,
        created_at,
        updated_at,
        title,
        company,
        location,
        source_url,
        description,
        active
      from job_listings
      where id = ${id}
      limit 1
    `;

    return rows[0] ? mapJobListingRow(rows[0]) : null;
  }

  const listings = await readListingsFile();
  return listings.find((listing) => listing.id === id) ?? null;
}

export async function createJobListing(
  input: z.infer<typeof jobListingInputSchema>,
): Promise<JobListing> {
  const now = new Date().toISOString();
  const listing: JobListing = {
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
    title: input.title.trim(),
    company: input.company?.trim() ?? "",
    location: input.location?.trim() ?? "",
    sourceUrl: input.sourceUrl?.trim() ?? "",
    description: input.description.trim(),
    active: input.active ?? true,
  };

  if (databaseUrl) {
    const sql = await getSql();
    const rows = await sql<JobListingRow[]>`
      insert into job_listings (
        id,
        created_at,
        updated_at,
        title,
        company,
        location,
        source_url,
        description,
        active
      ) values (
        ${listing.id},
        ${listing.createdAt},
        ${listing.updatedAt},
        ${listing.title},
        ${listing.company},
        ${listing.location},
        ${listing.sourceUrl},
        ${listing.description},
        ${listing.active}
      )
      returning
        id,
        created_at,
        updated_at,
        title,
        company,
        location,
        source_url,
        description,
        active
    `;

    return mapJobListingRow(rows[0]);
  }

  if (isHostedRuntime) {
    return listing;
  }

  const existing = await readListingsFile();
  existing.push(listing);
  await writeListingsFile(existing);
  return listing;
}

export async function updateJobListing(
  id: string,
  input: z.infer<typeof jobListingUpdateSchema>,
): Promise<JobListing | null> {
  if (databaseUrl) {
    const current = await getJobListingById(id);
    if (!current) {
      return null;
    }

    const updated: JobListing = {
      ...current,
      title: input.title?.trim() ?? current.title,
      company: input.company !== undefined ? input.company.trim() : current.company,
      location: input.location !== undefined ? input.location.trim() : current.location,
      sourceUrl: input.sourceUrl !== undefined ? input.sourceUrl.trim() : current.sourceUrl,
      description: input.description?.trim() ?? current.description,
      active: input.active ?? current.active,
      updatedAt: new Date().toISOString(),
    };

    const sql = await getSql();
    const rows = await sql<JobListingRow[]>`
      update job_listings
      set
        updated_at = ${updated.updatedAt},
        title = ${updated.title},
        company = ${updated.company},
        location = ${updated.location},
        source_url = ${updated.sourceUrl},
        description = ${updated.description},
        active = ${updated.active}
      where id = ${id}
      returning
        id,
        created_at,
        updated_at,
        title,
        company,
        location,
        source_url,
        description,
        active
    `;

    return rows[0] ? mapJobListingRow(rows[0]) : null;
  }

  if (isHostedRuntime) {
    return null;
  }

  const existing = await readListingsFile();
  const index = existing.findIndex((listing) => listing.id === id);
  if (index < 0) {
    return null;
  }

  const current = existing[index];
  const updated: JobListing = {
    ...current,
    title: input.title?.trim() ?? current.title,
    company: input.company !== undefined ? input.company.trim() : current.company,
    location: input.location !== undefined ? input.location.trim() : current.location,
    sourceUrl: input.sourceUrl !== undefined ? input.sourceUrl.trim() : current.sourceUrl,
    description: input.description?.trim() ?? current.description,
    active: input.active ?? current.active,
    updatedAt: new Date().toISOString(),
  };

  existing[index] = updated;
  await writeListingsFile(existing);
  return updated;
}

export async function deleteJobListing(id: string): Promise<boolean> {
  if (databaseUrl) {
    const sql = await getSql();
    const rows = await sql<{ id: string }[]>`
      delete from job_listings
      where id = ${id}
      returning id
    `;

    return rows.length > 0;
  }

  if (isHostedRuntime) {
    return false;
  }

  const existing = await readListingsFile();
  const next = existing.filter((listing) => listing.id !== id);
  if (next.length === existing.length) {
    return false;
  }

  await writeListingsFile(next);
  return true;
}
