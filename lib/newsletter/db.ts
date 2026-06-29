import { mkdirSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import Database from "better-sqlite3";
import { createClient, type Client } from "@libsql/client";

import { ensureCoreSchema } from "@/lib/database/core-schema";
import { getDatabaseUrl, getSql } from "@/lib/db";
import {
  CREATE_NEWSLETTER_SUBSCRIBERS_TABLE,
  type NewsletterSubscriber,
  type NewsletterSubscriberInsert,
} from "@/lib/newsletter/schema";

const SQLITE_PATH = path.join(process.cwd(), "data", "leads.db");

let sqliteDb: Database.Database | null = null;
let tursoClient: Client | null = null;
let schemaReady = false;

type SubscriberRow = {
  id: number | string;
  created_at: Date | string;
  email: string;
  name: string | null;
  role: string | null;
  industry: string | null;
  focus_areas: string | null;
  timezone: string | null;
  linkedin_url: string | null;
  source: string | null;
  unsubscribe_token: string;
  unsubscribed_at: Date | string | null;
  welcome_sent_at: Date | string | null;
  last_issue_sent_at: Date | string | null;
};

function usePostgres(): boolean {
  return Boolean(getDatabaseUrl());
}

function useTurso(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL?.trim() && process.env.TURSO_AUTH_TOKEN?.trim());
}

function getSqliteDb(): Database.Database {
  if (!sqliteDb) {
    mkdirSync(path.dirname(SQLITE_PATH), { recursive: true });
    sqliteDb = new Database(SQLITE_PATH);
    sqliteDb.pragma("journal_mode = WAL");
  }
  return sqliteDb;
}

function getTursoClient(): Client {
  if (!tursoClient) {
    tursoClient = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN!,
    });
  }
  return tursoClient;
}

function serializeFocusAreas(focusAreas: string[] | undefined): string | null {
  if (!focusAreas?.length) {
    return null;
  }
  return JSON.stringify(focusAreas);
}

function parseFocusAreas(raw: string | null): string[] {
  if (!raw?.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : String(value);
}

function rowToSubscriber(row: Record<string, unknown> | SubscriberRow): NewsletterSubscriber {
  return {
    id: Number(row.id),
    created_at: toIso(row.created_at as Date | string) ?? "",
    email: String(row.email),
    name: row.name != null ? String(row.name) : null,
    role: row.role != null ? String(row.role) : null,
    industry: row.industry != null ? String(row.industry) : null,
    focus_areas: parseFocusAreas(row.focus_areas != null ? String(row.focus_areas) : null),
    timezone: row.timezone != null ? String(row.timezone) : null,
    linkedin_url: row.linkedin_url != null ? String(row.linkedin_url) : null,
    source: row.source != null ? String(row.source) : null,
    unsubscribe_token: String(row.unsubscribe_token),
    unsubscribed_at: toIso(row.unsubscribed_at as Date | string | null),
    welcome_sent_at: toIso(row.welcome_sent_at as Date | string | null),
    last_issue_sent_at: toIso(row.last_issue_sent_at as Date | string | null),
  };
}

async function ensureSchema(): Promise<void> {
  if (schemaReady) {
    return;
  }

  if (usePostgres()) {
    await ensureCoreSchema();
  } else if (useTurso()) {
    await getTursoClient().execute(CREATE_NEWSLETTER_SUBSCRIBERS_TABLE);
  } else {
    getSqliteDb().exec(CREATE_NEWSLETTER_SUBSCRIBERS_TABLE);
  }

  schemaReady = true;
}

export async function upsertNewsletterSubscriber(
  input: NewsletterSubscriberInsert,
): Promise<NewsletterSubscriber> {
  await ensureSchema();

  const email = input.email.trim().toLowerCase();
  const focusAreasJson = serializeFocusAreas(input.focusAreas);
  const token = randomUUID();

  if (usePostgres()) {
    const sql = getSql();
    const rows = await sql<SubscriberRow[]>`
      insert into newsletter_subscribers (
        email,
        name,
        role,
        industry,
        focus_areas,
        timezone,
        linkedin_url,
        source,
        unsubscribe_token,
        unsubscribed_at
      ) values (
        ${email},
        ${input.name ?? null},
        ${input.role ?? null},
        ${input.industry ?? null},
        ${focusAreasJson},
        ${input.timezone ?? null},
        ${input.linkedinUrl ?? null},
        ${input.source ?? null},
        ${token},
        null
      )
      on conflict (email) do update set
        name = excluded.name,
        role = excluded.role,
        industry = excluded.industry,
        focus_areas = excluded.focus_areas,
        timezone = excluded.timezone,
        linkedin_url = excluded.linkedin_url,
        source = excluded.source,
        unsubscribed_at = null
      returning *
    `;
    return rowToSubscriber(rows[0]);
  }

  if (useTurso()) {
    const client = getTursoClient();
    const existing = await client.execute({
      sql: "SELECT id FROM newsletter_subscribers WHERE email = ? LIMIT 1",
      args: [email],
    });

    if (existing.rows.length > 0) {
      const result = await client.execute({
        sql: `UPDATE newsletter_subscribers
              SET name = ?, role = ?, industry = ?, focus_areas = ?, timezone = ?,
                  linkedin_url = ?, source = ?, unsubscribed_at = NULL
              WHERE email = ?
              RETURNING *`,
        args: [
          input.name ?? null,
          input.role ?? null,
          input.industry ?? null,
          focusAreasJson,
          input.timezone ?? null,
          input.linkedinUrl ?? null,
          input.source ?? null,
          email,
        ],
      });
      return rowToSubscriber(result.rows[0] as Record<string, unknown>);
    }

    const result = await client.execute({
      sql: `INSERT INTO newsletter_subscribers (
              email, name, role, industry, focus_areas, timezone, linkedin_url, source, unsubscribe_token
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *`,
      args: [
        email,
        input.name ?? null,
        input.role ?? null,
        input.industry ?? null,
        focusAreasJson,
        input.timezone ?? null,
        input.linkedinUrl ?? null,
        input.source ?? null,
        token,
      ],
    });
    return rowToSubscriber(result.rows[0] as Record<string, unknown>);
  }

  const db = getSqliteDb();
  const existing = db
    .prepare("SELECT id FROM newsletter_subscribers WHERE email = ?")
    .get(email) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE newsletter_subscribers
       SET name = @name, role = @role, industry = @industry, focus_areas = @focus_areas,
           timezone = @timezone, linkedin_url = @linkedin_url, source = @source, unsubscribed_at = NULL
       WHERE email = @email`,
    ).run({
      email,
      name: input.name ?? null,
      role: input.role ?? null,
      industry: input.industry ?? null,
      focus_areas: focusAreasJson,
      timezone: input.timezone ?? null,
      linkedin_url: input.linkedinUrl ?? null,
      source: input.source ?? null,
    });
  } else {
    db.prepare(
      `INSERT INTO newsletter_subscribers (
         email, name, role, industry, focus_areas, timezone, linkedin_url, source, unsubscribe_token
       ) VALUES (
         @email, @name, @role, @industry, @focus_areas, @timezone, @linkedin_url, @source, @unsubscribe_token
       )`,
    ).run({
      email,
      name: input.name ?? null,
      role: input.role ?? null,
      industry: input.industry ?? null,
      focus_areas: focusAreasJson,
      timezone: input.timezone ?? null,
      linkedin_url: input.linkedinUrl ?? null,
      source: input.source ?? null,
      unsubscribe_token: token,
    });
  }

  const row = db
    .prepare("SELECT * FROM newsletter_subscribers WHERE email = ?")
    .get(email) as Record<string, unknown>;

  return rowToSubscriber(row);
}

export async function markNewsletterWelcomeSent(subscriberId: number): Promise<void> {
  await ensureSchema();
  const now = new Date().toISOString();

  if (usePostgres()) {
    const sql = getSql();
    await sql`
      update newsletter_subscribers
      set welcome_sent_at = ${now}
      where id = ${subscriberId}
    `;
    return;
  }

  if (useTurso()) {
    await getTursoClient().execute({
      sql: "UPDATE newsletter_subscribers SET welcome_sent_at = ? WHERE id = ?",
      args: [now, subscriberId],
    });
    return;
  }

  getSqliteDb()
    .prepare("UPDATE newsletter_subscribers SET welcome_sent_at = ? WHERE id = ?")
    .run(now, subscriberId);
}

export async function unsubscribeNewsletterByToken(token: string): Promise<boolean> {
  await ensureSchema();
  const now = new Date().toISOString();

  if (usePostgres()) {
    const sql = getSql();
    const rows = await sql<{ id: number }[]>`
      update newsletter_subscribers
      set unsubscribed_at = ${now}
      where unsubscribe_token = ${token} and unsubscribed_at is null
      returning id
    `;
    return rows.length > 0;
  }

  if (useTurso()) {
    const result = await getTursoClient().execute({
      sql: `UPDATE newsletter_subscribers
            SET unsubscribed_at = ?
            WHERE unsubscribe_token = ? AND unsubscribed_at IS NULL`,
      args: [now, token],
    });
    return result.rowsAffected > 0;
  }

  const info = getSqliteDb()
    .prepare(
      `UPDATE newsletter_subscribers
       SET unsubscribed_at = ?
       WHERE unsubscribe_token = ? AND unsubscribed_at IS NULL`,
    )
    .run(now, token);

  return info.changes > 0;
}
