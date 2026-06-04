import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { createClient, type Client } from "@libsql/client";

import { CREATE_LEADS_TABLE, type Lead, type LeadInsert } from "@/lib/leads/schema";

const SQLITE_PATH = path.join(process.cwd(), "data", "leads.db");

let sqliteDb: Database.Database | null = null;
let tursoClient: Client | null = null;
let schemaReady = false;

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

async function ensureSchema(): Promise<void> {
  if (schemaReady) {
    return;
  }

  if (useTurso()) {
    await getTursoClient().execute(CREATE_LEADS_TABLE);
  } else {
    getSqliteDb().exec(CREATE_LEADS_TABLE);
  }

  schemaReady = true;
}

function rowToLead(row: Record<string, unknown>): Lead {
  return {
    id: Number(row.id),
    created_at: String(row.created_at),
    name: String(row.name),
    email: String(row.email),
    school: row.school != null ? String(row.school) : null,
    grad_year: row.grad_year != null ? String(row.grad_year) : null,
    role_type: row.role_type != null ? String(row.role_type) : null,
    industries: row.industries != null ? String(row.industries) : null,
    linkedin: row.linkedin != null ? String(row.linkedin) : null,
    referral: row.referral != null ? String(row.referral) : null,
  };
}

export async function insertLead(input: LeadInsert): Promise<Lead> {
  await ensureSchema();

  if (useTurso()) {
    const result = await getTursoClient().execute({
      sql: `INSERT INTO leads (name, email, school, grad_year, role_type, industries, linkedin, referral)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            RETURNING *`,
      args: [
        input.name,
        input.email,
        input.school ?? null,
        input.grad_year ?? null,
        input.role_type ?? null,
        input.industries ?? null,
        input.linkedin ?? null,
        input.referral ?? null,
      ],
    });

    return rowToLead(result.rows[0] as Record<string, unknown>);
  }

  const stmt = getSqliteDb().prepare(
    `INSERT INTO leads (name, email, school, grad_year, role_type, industries, linkedin, referral)
     VALUES (@name, @email, @school, @grad_year, @role_type, @industries, @linkedin, @referral)`,
  );

  const info = stmt.run({
    name: input.name,
    email: input.email,
    school: input.school ?? null,
    grad_year: input.grad_year ?? null,
    role_type: input.role_type ?? null,
    industries: input.industries ?? null,
    linkedin: input.linkedin ?? null,
    referral: input.referral ?? null,
  });

  const row = getSqliteDb()
    .prepare("SELECT * FROM leads WHERE id = ?")
    .get(info.lastInsertRowid) as Record<string, unknown>;

  return rowToLead(row);
}

export async function listLeads(): Promise<Lead[]> {
  await ensureSchema();

  if (useTurso()) {
    const result = await getTursoClient().execute(
      "SELECT * FROM leads ORDER BY datetime(created_at) DESC",
    );
    return result.rows.map((row) => rowToLead(row as Record<string, unknown>));
  }

  const rows = getSqliteDb()
    .prepare("SELECT * FROM leads ORDER BY datetime(created_at) DESC")
    .all() as Record<string, unknown>[];

  return rows.map(rowToLead);
}
