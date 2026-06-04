import { listCandidates } from "@/lib/database/candidates";
import { listCandidateConversions } from "@/lib/database/conversions";
import { getCoreDatabaseStoreLabel, ensureCoreSchema } from "@/lib/database/core-schema";
import { listGroupMembers, listGroups } from "@/lib/database/groups";
import { listQuizCompletions } from "@/lib/database/intake-quiz";
import { listUsers, type UserRecord } from "@/lib/database/users";
import { getDatabaseUrl } from "@/lib/db";
import { listLeads } from "@/lib/leads/db";
import { upsertCandidate } from "@/lib/database/candidates";
import { upsertUserFromCommit } from "@/lib/database/users";
import { listTrackCommits, type TrackCommitAdminRow } from "@/lib/track-commits";
import type { IntakeSubmission } from "@/lib/submissions";
import { syncIntakeSubmissionToQuiz } from "@/lib/database/intake-quiz";

export type AdminCoreData = {
  storeLabel: string;
  configured: boolean;
  candidates: Awaited<ReturnType<typeof listCandidates>>;
  users: UserRecord[];
  userRows: TrackCommitAdminRow[];
  groups: Awaited<ReturnType<typeof listGroups>>;
  groupMembers: Awaited<ReturnType<typeof listGroupMembers>>;
  conversions: Awaited<ReturnType<typeof listCandidateConversions>>;
  quizCompletions: Awaited<ReturnType<typeof listQuizCompletions>>;
};

function userToAdminRow(user: UserRecord): TrackCommitAdminRow {
  return {
    id: user.userId,
    createdAt: user.sprintCommittedAt ?? user.createdAt,
    trackId: user.sprintTrackId ?? "",
    trackTitle: user.sprintTrackTitle ?? "",
    name: [user.firstName, user.lastName].filter(Boolean).join(" ") || "",
    email: user.email,
    phone: user.phone ?? "",
    finishDate: user.sprintFinishDate ?? "",
    linkedIn: user.linkedinUrl,
  };
}

async function backfillFromLegacy(submissions: IntakeSubmission[]) {
  if (!getDatabaseUrl()) {
    return;
  }

  try {
    const leads = await listLeads();
    for (const lead of leads) {
      await upsertCandidate({
        email: lead.email,
        name: lead.name,
        linkedinUrl: lead.linkedin,
      });
    }
  } catch {
    // Leads store optional.
  }

  const commits = await listTrackCommits();
  for (const commit of commits) {
    const email = commit.email.trim().toLowerCase();
    const linkedIn =
      submissions.find((s) => s.contact.email?.trim().toLowerCase() === email)?.resumeSnapshot
        ?.linkedInUrl ?? null;

    await upsertUserFromCommit({
      email: commit.email,
      name: commit.name || commit.email,
      phone: commit.phone,
      trackId: commit.trackId,
      trackTitle: commit.trackTitle,
      finishDate: commit.finishDate,
      linkedinUrl: linkedIn,
      conversionSource: "legacy_import",
    });
  }

  for (const submission of submissions) {
    await syncIntakeSubmissionToQuiz(submission);
  }
}

export async function loadAdminCoreData(
  submissions: IntakeSubmission[],
): Promise<AdminCoreData> {
  const configured = Boolean(getDatabaseUrl());

  if (!configured) {
    return {
      storeLabel: getCoreDatabaseStoreLabel(),
      configured: false,
      candidates: [],
      users: [],
      userRows: [],
      groups: [],
      groupMembers: [],
      conversions: [],
      quizCompletions: [],
    };
  }

  await ensureCoreSchema();

  const usersBefore = await listUsers();
  if (usersBefore.length === 0 && submissions.length > 0) {
    await backfillFromLegacy(submissions);
  }

  const [candidates, users, groups, groupMembers, conversions, quizCompletions] =
    await Promise.all([
      listCandidates(),
      listUsers(),
      listGroups(),
      listGroupMembers(),
      listCandidateConversions(),
      listQuizCompletions(),
    ]);

  const committedUsers = users.filter((user) => user.sprintTrackTitle);
  const userRows =
    committedUsers.length > 0
      ? committedUsers.map(userToAdminRow)
      : (await listTrackCommits()).map((commit) => ({
          ...commit,
          linkedIn:
            submissions.find(
              (s) => s.contact.email?.trim().toLowerCase() === commit.email.trim().toLowerCase(),
            )?.resumeSnapshot?.linkedInUrl ?? null,
        }));

  return {
    storeLabel: getCoreDatabaseStoreLabel(),
    configured: true,
    candidates,
    users,
    userRows,
    groups,
    groupMembers,
    conversions,
    quizCompletions,
  };
}
