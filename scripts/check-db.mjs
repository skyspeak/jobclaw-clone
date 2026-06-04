import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) {
    return;
  }
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq < 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  console.log("STATUS: not_configured");
  console.log("REASON: DATABASE_URL and POSTGRES_URL are both unset in .env.local");
  process.exit(1);
}

const masked = databaseUrl.replace(/:([^:@/]+)@/, ":***@");
console.log("STATUS: url_present");
console.log("URL (masked):", masked);

const isLocalhost =
  databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
const isSupabase = databaseUrl.includes("supabase");
const usesPooler =
  databaseUrl.includes("pooler.supabase.com") || databaseUrl.includes(":6543");

const sql = postgres(databaseUrl, {
  max: 1,
  ssl: isLocalhost ? false : "require",
  prepare: isLocalhost && !usesPooler && !isSupabase,
  connect_timeout: 30,
});

try {
  const version = await sql`select version() as v`;
  console.log("CONNECT: ok");
  console.log("POSTGRES:", version[0].v.split(" ").slice(0, 2).join(" "));

  const tables = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('intake_submissions', 'job_listings')
    order by table_name
  `;
  console.log(
    "TABLES:",
    tables.length ? tables.map((row) => row.table_name).join(", ") : "(none yet)",
  );

  if (tables.length < 2) {
    console.log("MIGRATE: creating missing tables...");
    await sql`
      create table if not exists intake_submissions (
        id text primary key,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        contact jsonb not null,
        answers jsonb not null,
        defaults jsonb not null,
        result jsonb not null,
        profile_draft jsonb
      )
    `;
    await sql`
      alter table intake_submissions
      add column if not exists resume_snapshot jsonb
    `;
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
    const after = await sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('intake_submissions', 'job_listings')
      order by table_name
    `;
    console.log("TABLES_AFTER:", after.map((row) => row.table_name).join(", "));
  }

  console.log("MIGRATE: ensuring core schema (database_architecture.md)...");
  const coreTables = [
    `create table if not exists candidates (
      candidate_id uuid primary key,
      email varchar(255) not null unique,
      phone varchar(20),
      linkedin_url varchar(500),
      first_name varchar(100),
      last_name varchar(100),
      created_at timestamptz not null default now(),
      converted_at timestamptz,
      status text not null default 'active'
        check (status in ('active', 'converted', 'disqualified'))
    )`,
    `create table if not exists users (
      user_id uuid primary key,
      email varchar(255) not null unique,
      phone varchar(20),
      linkedin_url varchar(500),
      first_name varchar(100),
      last_name varchar(100),
      created_at timestamptz not null default now(),
      candidate_id uuid references candidates(candidate_id),
      sprint_track_id varchar(100),
      sprint_track_title varchar(255),
      sprint_committed_at timestamptz,
      sprint_finish_date timestamptz,
      pairing_track varchar(32),
      pairing_status varchar(32),
      pairing_joined_at timestamptz,
      pairing_group_id uuid
    )`,
    `create table if not exists candidate_conversions (
      conversion_id uuid primary key,
      candidate_id uuid not null references candidates(candidate_id),
      user_id uuid not null references users(user_id),
      converted_at timestamptz not null default now(),
      conversion_source varchar(100) not null
    )`,
    `create table if not exists groups (
      group_id uuid primary key,
      name varchar(255),
      created_at timestamptz not null default now(),
      created_by uuid references users(user_id),
      pairing_track varchar(32),
      group_status varchar(32) not null default 'forming'
    )`,
    `create table if not exists group_members (
      group_id uuid not null references groups(group_id) on delete cascade,
      user_id uuid not null references users(user_id) on delete cascade,
      joined_at timestamptz not null default now(),
      role text not null default 'member' check (role in ('owner', 'member')),
      primary key (group_id, user_id)
    )`,
    `create table if not exists quizzes (
      quiz_id uuid primary key,
      title varchar(255) not null,
      created_at timestamptz not null default now()
    )`,
    `create table if not exists questions (
      question_id uuid primary key,
      quiz_id uuid not null references quizzes(quiz_id) on delete cascade,
      question_text text not null,
      question_type text not null default 'text',
      position int not null default 0
    )`,
    `create table if not exists quiz_completions (
      completion_id uuid primary key,
      quiz_id uuid not null references quizzes(quiz_id),
      user_id uuid not null references users(user_id),
      completed_at timestamptz not null default now(),
      unique (quiz_id, user_id)
    )`,
    `create table if not exists answers (
      answer_id uuid primary key,
      completion_id uuid not null references quiz_completions(completion_id) on delete cascade,
      question_id uuid not null references questions(question_id),
      answer_text text,
      answered_at timestamptz not null default now()
    )`,
  ];

  for (const statement of coreTables) {
    await sql.unsafe(statement);
  }

  await sql`
    insert into quizzes (quiz_id, title)
    values ('00000000-0000-4000-8000-000000000001'::uuid, 'dear[CC] intake survey')
    on conflict (quiz_id) do nothing
  `;

  const core = await sql`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in (
        'candidates', 'users', 'candidate_conversions', 'groups',
        'group_members', 'quizzes', 'questions', 'quiz_completions', 'answers'
      )
    order by table_name
  `;
  console.log("CORE_TABLES:", core.map((row) => row.table_name).join(", "));

  await sql.end();
  console.log("DONE: ok");
} catch (error) {
  console.log("CONNECT: failed");
  const message = error instanceof Error ? error.message : String(error);
  console.log("ERROR:", message);
  if (message.includes("Invalid URL") || (error && typeof error === "object" && "code" in error && error.code === "ERR_INVALID_URL")) {
    console.log("");
    console.log("HINT: If your database password has @ # ! % & etc., URL-encode it in DATABASE_URL.");
    console.log("  @ → %40   # → %23   ! → %21");
    console.log("Or reset the password in Supabase to letters and numbers only.");
  }
  await sql.end().catch(() => {});
  process.exit(2);
}
