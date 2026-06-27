import { mkdirSync } from "node:fs";
import path from "node:path";

import Database from "better-sqlite3";
import { createClient, type Client } from "@libsql/client";

import { upsertCandidate } from "@/lib/database/candidates";
import { ensureCoreSchema } from "@/lib/database/core-schema";
import { getDatabaseUrl, getSql } from "@/lib/db";
import { CREATE_LEADS_TABLE, type Lead, type LeadInsert } from "@/lib/leads/schema";

const SQLITE_PATH = path.join(process.cwd(), "data", "leads.db");

let sqliteDb: Database.Database | null = null;
let tursoClient: Client | null = null;
let schemaReady = false;

type LeadRow = {
  id: number | string;
  created_at: Date | string;
  name: string;
  email: string;
  school: string | null;
  grad_year: string | null;
  role_type: string | null;
  industries: string | null;
  linkedin: string | null;
  referral: string | null;
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

async function ensureSchema(): Promise<void> {
  if (schemaReady) {
    return;
  }

  if (usePostgres()) {
    await ensureCoreSchema();
  } else if (useTurso()) {
    await getTursoClient().execute(CREATE_LEADS_TABLE);
  } else {
    getSqliteDb().exec(CREATE_LEADS_TABLE);
  }

  schemaReady = true;
}

function rowToLead(row: Record<string, unknown> | LeadRow): Lead {
  const createdAt = row.created_at;
  return {
    id: Number(row.id),
    created_at:
      createdAt instanceof Date ? createdAt.toISOString() : String(createdAt),
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

function syncCandidate(input: LeadInsert) {
  void upsertCandidate({
    email: input.email,
    name: input.name,
    linkedinUrl: input.linkedin ?? null,
    phone: input.phone ?? null,
  });
}

async function insertLeadPostgres(input: LeadInsert): Promise<Lead> {
  const sql = getSql();
  const rows = await sql<LeadRow[]>`
    insert into leads (
      name,
      email,
      school,
      grad_year,
      role_type,
      industries,
      linkedin,
      referral
    ) values (
      ${input.name},
      ${input.email},
      ${input.school ?? null},
      ${input.grad_year ?? null},
      ${input.role_type ?? null},
      ${input.industries ?? null},
      ${input.linkedin ?? null},
      ${input.referral ?? null}
    )
    returning *
  `;

  const lead = rowToLead(rows[0]);
  syncCandidate(input);
  return lead;
}

async function listLeadsPostgres(): Promise<Lead[]> {
  const sql = getSql();
  const rows = await sql<LeadRow[]>`
    select * from leads order by created_at desc
  `;
  return rows.map((row) => rowToLead(row));
}

export async function insertLead(input: LeadInsert): Promise<Lead> {
  await ensureSchema();

  if (usePostgres()) {
    return insertLeadPostgres(input);
  }

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

    const lead = rowToLead(result.rows[0] as Record<string, unknown>);
    syncCandidate(input);
    return lead;
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

  const lead = rowToLead(row);
  syncCandidate(input);
  return lead;
}

export async function listLeads(): Promise<Lead[]> {
  await ensureSchema();

  if (usePostgres()) {
    return listLeadsPostgres();
  }

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
