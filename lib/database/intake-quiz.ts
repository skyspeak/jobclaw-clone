import { createHash } from "node:crypto";

import { getDatabaseUrl, getSql } from "@/lib/db";
import { getDearccIntakeQuizId, ensureCoreSchema } from "@/lib/database/core-schema";
import { splitFullName } from "@/lib/database/names";
import { findUserByEmail } from "@/lib/database/users";
import { intakeQuestions } from "@/lib/jobclaw";
import type { IntakeSubmission } from "@/lib/submissions";

function stableQuestionUuid(questionKey: string): string {
  const hex = createHash("sha256").update(`dearcc-question:${questionKey}`).digest("hex").slice(0, 12);
  return `00000000-0000-4000-8000-${hex}`;
}

export async function syncIntakeSubmissionToQuiz(submission: IntakeSubmission): Promise<void> {
  if (!getDatabaseUrl()) {
    return;
  }

  const email = submission.contact.email?.trim().toLowerCase();
  if (!email) {
    return;
  }

  await ensureCoreSchema();
  const sql = getSql();
  const quizId = getDearccIntakeQuizId();
  const { firstName, lastName } = splitFullName(submission.contact.name ?? "");

  let user = await findUserByEmail(email);
  if (!user) {
    const userId = crypto.randomUUID();
    const rows = await sql<{ user_id: string }[]>`
      insert into users (user_id, email, phone, linkedin_url, first_name, last_name)
      values (
        ${userId}::uuid,
        ${email},
        ${submission.contact.phone?.trim() || null},
        ${submission.resumeSnapshot?.linkedInUrl?.trim() || null},
        ${firstName || null},
        ${lastName || null}
      )
      on conflict (email) do update set
        phone = coalesce(excluded.phone, users.phone),
        linkedin_url = coalesce(excluded.linkedin_url, users.linkedin_url),
        first_name = coalesce(nullif(excluded.first_name, ''), users.first_name),
        last_name = coalesce(nullif(excluded.last_name, ''), users.last_name)
      returning user_id
    `;
    user = await findUserByEmail(email);
    if (!user) {
      return;
    }
    void rows;
  }

  for (const [index, question] of intakeQuestions.entries()) {
    const questionId = stableQuestionUuid(question.id);
    await sql`
      insert into questions (question_id, quiz_id, question_text, question_type, position)
      values (
        ${questionId}::uuid,
        ${quizId}::uuid,
        ${question.label},
        'text',
        ${index}
      )
      on conflict (question_id) do update set
        question_text = excluded.question_text,
        position = excluded.position
    `;
  }

  const completionId = crypto.randomUUID();
  await sql`
    insert into quiz_completions (completion_id, quiz_id, user_id, completed_at)
    values (
      ${completionId}::uuid,
      ${quizId}::uuid,
      ${user.userId}::uuid,
      ${submission.createdAt}
    )
    on conflict (quiz_id, user_id) do update set completed_at = excluded.completed_at
  `;

  const completionRows = await sql<{ completion_id: string }[]>`
    select completion_id from quiz_completions
    where quiz_id = ${quizId}::uuid and user_id = ${user.userId}::uuid
    limit 1
  `;
  const resolvedCompletionId = completionRows[0]?.completion_id ?? completionId;

  await sql`
    delete from answers where completion_id = ${resolvedCompletionId}::uuid
  `;

  for (const question of intakeQuestions) {
    const answerText = submission.answers[question.id]?.trim() ?? "";
    const questionId = stableQuestionUuid(question.id);
    const answerId = crypto.randomUUID();

    await sql`
      insert into answers (answer_id, completion_id, question_id, answer_text, answered_at)
      values (
        ${answerId}::uuid,
        ${resolvedCompletionId}::uuid,
        ${questionId}::uuid,
        ${answerText},
        ${submission.updatedAt}
      )
    `;
  }
}

export type QuizCompletionAdminRow = {
  completionId: string;
  userId: string;
  email: string;
  completedAt: string;
  answerCount: number;
};

export async function listQuizCompletions(): Promise<QuizCompletionAdminRow[]> {
  if (!getDatabaseUrl()) {
    return [];
  }

  await ensureCoreSchema();
  const sql = getSql();
  const quizId = getDearccIntakeQuizId();

  const rows = await sql<
    Array<{
      completion_id: string;
      user_id: string;
      email: string;
      completed_at: Date | string;
      answer_count: number;
    }>
  >`
    select
      qc.completion_id,
      qc.user_id,
      u.email,
      qc.completed_at,
      count(a.answer_id)::int as answer_count
    from quiz_completions qc
    join users u on u.user_id = qc.user_id
    left join answers a on a.completion_id = qc.completion_id
    where qc.quiz_id = ${quizId}::uuid
    group by qc.completion_id, qc.user_id, u.email, qc.completed_at
    order by qc.completed_at desc
  `;

  return rows.map((row) => ({
    completionId: row.completion_id,
    userId: row.user_id,
    email: row.email,
    completedAt: new Date(row.completed_at).toISOString(),
    answerCount: row.answer_count,
  }));
}
