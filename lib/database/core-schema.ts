import { getDatabaseUrl, getSql } from "@/lib/db";

const DEARCC_INTAKE_QUIZ_ID = "00000000-0000-4000-8000-000000000001";

export function getDearccIntakeQuizId() {
  return DEARCC_INTAKE_QUIZ_ID;
}

export async function ensureCoreSchema() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    return false;
  }

  const sql = getSql();

  await sql`
    create table if not exists candidates (
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
    )
  `;

  await sql`
    create table if not exists users (
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
    )
  `;

  await sql`
    alter table users add column if not exists sprint_track_id varchar(100)
  `;
  await sql`
    alter table users add column if not exists sprint_track_title varchar(255)
  `;
  await sql`
    alter table users add column if not exists sprint_committed_at timestamptz
  `;
  await sql`
    alter table users add column if not exists sprint_finish_date timestamptz
  `;
  await sql`
    alter table users add column if not exists pairing_track varchar(32)
  `;
  await sql`
    alter table users add column if not exists pairing_status varchar(32)
  `;
  await sql`
    alter table users add column if not exists pairing_joined_at timestamptz
  `;
  await sql`
    alter table users add column if not exists pairing_group_id uuid
  `;

  await sql`
    create table if not exists candidate_conversions (
      conversion_id uuid primary key,
      candidate_id uuid not null references candidates(candidate_id),
      user_id uuid not null references users(user_id),
      converted_at timestamptz not null default now(),
      conversion_source varchar(100) not null
    )
  `;

  await sql`
    create table if not exists groups (
      group_id uuid primary key,
      name varchar(255),
      created_at timestamptz not null default now(),
      created_by uuid references users(user_id),
      pairing_track varchar(32),
      group_status varchar(32) not null default 'forming'
    )
  `;

  await sql`
    alter table groups add column if not exists pairing_track varchar(32)
  `;
  await sql`
    alter table groups add column if not exists group_status varchar(32) not null default 'forming'
  `;

  await sql`
    create table if not exists group_members (
      group_id uuid not null references groups(group_id) on delete cascade,
      user_id uuid not null references users(user_id) on delete cascade,
      joined_at timestamptz not null default now(),
      role text not null default 'member' check (role in ('owner', 'member')),
      primary key (group_id, user_id)
    )
  `;

  await sql`
    create table if not exists quizzes (
      quiz_id uuid primary key,
      title varchar(255) not null,
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists questions (
      question_id uuid primary key,
      quiz_id uuid not null references quizzes(quiz_id) on delete cascade,
      question_text text not null,
      question_type text not null default 'text'
        check (question_type in ('multiple_choice', 'text', 'boolean')),
      position int not null default 0
    )
  `;

  await sql`
    create table if not exists quiz_completions (
      completion_id uuid primary key,
      quiz_id uuid not null references quizzes(quiz_id),
      user_id uuid not null references users(user_id),
      completed_at timestamptz not null default now(),
      unique (quiz_id, user_id)
    )
  `;

  await sql`
    create table if not exists answers (
      answer_id uuid primary key,
      completion_id uuid not null references quiz_completions(completion_id) on delete cascade,
      question_id uuid not null references questions(question_id),
      answer_text text,
      answered_at timestamptz not null default now()
    )
  `;

  await sql`
    insert into quizzes (quiz_id, title)
    values (${DEARCC_INTAKE_QUIZ_ID}::uuid, ${"dear[CC] intake survey"})
    on conflict (quiz_id) do nothing
  `;

  return true;
}

export function getCoreDatabaseStoreLabel() {
  return getDatabaseUrl() ? "Postgres (database_architecture.md)" : "Not configured — set DATABASE_URL";
}
