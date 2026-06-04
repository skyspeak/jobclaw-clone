"use client";

import { AdminDataTable } from "@/app/components/AdminDataTable";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdminCoreData } from "@/lib/database/admin-data";
import type { CandidateRecord } from "@/lib/database/candidates";
import type { ConversionRecord } from "@/lib/database/conversions";
import type { GroupMemberRecord, GroupRecord } from "@/lib/database/groups";
import type { QuizCompletionAdminRow } from "@/lib/database/intake-quiz";
import type { UserRecord } from "@/lib/database/users";
import type { TrackCommitAdminRow } from "@/lib/track-commits";

type AdminCoreDatabaseProps = {
  data: AdminCoreData;
};

function formatName(first: string | null, last: string | null) {
  return [first, last].filter(Boolean).join(" ") || "—";
}

export function AdminCoreDatabase({ data }: AdminCoreDatabaseProps) {
  if (!data.configured) {
    return (
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="p-8 md:p-10">
          <CardTitle className="text-xl tracking-tight">Core database (Postgres)</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Set <code className="text-foreground">DATABASE_URL</code> to enable the schema in{" "}
            <code className="text-foreground">database_architecture.md</code>: candidates, users,
            groups, conversions, and quiz answers. Legacy JSON intake storage can still run in
            parallel until Postgres is configured.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-14">
      <Card className="border-primary/30 bg-primary/[0.04] shadow-sm">
        <CardHeader className="space-y-2 p-8 md:p-10">
          <CardTitle className="text-xl tracking-tight">Core database</CardTitle>
          <CardDescription className="text-base leading-relaxed">
            Admin reads from the canonical Postgres schema: candidates → users → groups, with quiz
            completions and conversion audit trails. Pairing and sprint commits sync into{" "}
            <code className="text-foreground">users</code> and{" "}
            <code className="text-foreground">group_members</code>.
          </CardDescription>
          <p className="text-sm font-medium text-muted-foreground">
            Storage: <span className="text-card-foreground">{data.storeLabel}</span>
          </p>
        </CardHeader>
        <CardContent className="border-t border-border/60 px-8 pb-8 pt-0 md:px-10">
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-5">
            <Metric label="Candidates" value={data.candidates.length} />
            <Metric label="Users" value={data.users.length} />
            <Metric label="Groups" value={data.groups.length} />
            <Metric label="Conversions" value={data.conversions.length} />
            <Metric label="Quiz completions" value={data.quizCompletions.length} />
          </dl>
        </CardContent>
      </Card>

      <AdminDataTable<CandidateRecord>
        title="Candidates"
        description="Pre-conversion interest (lead-gen and similar). Maps to candidates in the architecture doc."
        rows={data.candidates}
        csvFileName="dearcc-candidates"
        searchPlaceholder="Search email, name, status…"
        emptyMessage="No candidates in Postgres yet."
        getSearchText={(row) =>
          [row.candidateId, row.email, row.firstName, row.lastName, row.status, row.linkedinUrl]
            .filter(Boolean)
            .join(" ")
        }
        columns={[
          { key: "candidate_id", label: "Candidate ID", render: (r) => r.candidateId },
          { key: "email", label: "Email", render: (r) => r.email },
          {
            key: "name",
            label: "Name",
            render: (r) => formatName(r.firstName, r.lastName),
          },
          { key: "phone", label: "Phone", render: (r) => r.phone ?? "—" },
          { key: "linkedin", label: "LinkedIn", render: (r) => r.linkedinUrl ?? "—" },
          { key: "status", label: "Status", render: (r) => r.status },
          {
            key: "created_at",
            label: "Created",
            render: (r) => new Date(r.createdAt).toLocaleString(),
            sortValue: (r) => r.createdAt,
          },
        ]}
      />

      <AdminDataTable<TrackCommitAdminRow>
        title="Users — sprint commitments"
        description="Users with sprint track data (replaces the old JSON-only commitments export)."
        rows={data.userRows}
        csvFileName="dearcc-users-sprint-commitments"
        searchPlaceholder="Search user ID, email, track…"
        emptyMessage="No sprint commitments in users table yet."
        getSearchText={(row) =>
          [row.id, row.email, row.phone, row.trackTitle, row.linkedIn, row.name].filter(Boolean).join(" ")
        }
        columns={[
          { key: "user_id", label: "User ID", render: (r) => r.id },
          { key: "email", label: "Email", render: (r) => r.email },
          { key: "linkedin", label: "LinkedIn", render: (r) => r.linkedIn ?? "—" },
          { key: "phone", label: "Phone", render: (r) => r.phone },
          { key: "track", label: "Track committed", render: (r) => r.trackTitle || "—" },
          {
            key: "committed_at",
            label: "Committed",
            render: (r) => new Date(r.createdAt).toLocaleString(),
            sortValue: (r) => r.createdAt,
          },
        ]}
      />

      <AdminDataTable<UserRecord>
        title="Users (all)"
        description="Full users table including pairing queue state."
        rows={data.users}
        csvFileName="dearcc-users"
        emptyMessage="No users yet."
        getSearchText={(row) =>
          [row.userId, row.email, row.pairingTrack, row.sprintTrackTitle].filter(Boolean).join(" ")
        }
        columns={[
          { key: "user_id", label: "User ID", render: (r) => r.userId },
          { key: "email", label: "Email", render: (r) => r.email },
          { key: "linkedin", label: "LinkedIn", render: (r) => r.linkedinUrl ?? "—" },
          { key: "phone", label: "Phone", render: (r) => r.phone ?? "—" },
          { key: "sprint", label: "Sprint", render: (r) => r.sprintTrackTitle ?? "—" },
          { key: "pairing", label: "Pairing", render: (r) => r.pairingStatus ?? "—" },
          {
            key: "created",
            label: "Created",
            render: (r) => new Date(r.createdAt).toLocaleString(),
            sortValue: (r) => r.createdAt,
          },
        ]}
      />

      <AdminDataTable<GroupRecord>
        title="Groups"
        description="Sprint cohort groups (max 4 members enforced in the matcher)."
        rows={data.groups}
        csvFileName="dearcc-groups"
        emptyMessage="No groups formed yet."
        columns={[
          { key: "group_id", label: "Group ID", render: (r) => r.groupId },
          { key: "name", label: "Name", render: (r) => r.name ?? "—" },
          { key: "track", label: "Track", render: (r) => r.pairingTrack ?? "—" },
          { key: "status", label: "Status", render: (r) => r.groupStatus },
          { key: "members", label: "Members", render: (r) => String(r.memberCount) },
          {
            key: "created",
            label: "Created",
            render: (r) => new Date(r.createdAt).toLocaleString(),
            sortValue: (r) => r.createdAt,
          },
        ]}
      />

      <AdminDataTable<GroupMemberRecord>
        title="Group members"
        description="Membership rows linking users to groups."
        rows={data.groupMembers}
        csvFileName="dearcc-group-members"
        emptyMessage="No group members yet."
        columns={[
          { key: "group_id", label: "Group ID", render: (r) => r.groupId },
          { key: "user_id", label: "User ID", render: (r) => r.userId },
          { key: "email", label: "Email", render: (r) => r.email },
          {
            key: "name",
            label: "Name",
            render: (r) => formatName(r.firstName, r.lastName),
          },
          { key: "role", label: "Role", render: (r) => r.role },
        ]}
      />

      <AdminDataTable<ConversionRecord>
        title="Candidate conversions"
        description="Audit trail when a candidate becomes a user."
        rows={data.conversions}
        csvFileName="dearcc-conversions"
        emptyMessage="No conversions recorded yet."
        columns={[
          { key: "conversion_id", label: "Conversion ID", render: (r) => r.conversionId },
          { key: "candidate_id", label: "Candidate ID", render: (r) => r.candidateId },
          { key: "user_id", label: "User ID", render: (r) => r.userId },
          { key: "candidate_email", label: "Candidate email", render: (r) => r.candidateEmail },
          { key: "user_email", label: "User email", render: (r) => r.userEmail },
          { key: "source", label: "Source", render: (r) => r.conversionSource },
          {
            key: "converted_at",
            label: "Converted",
            render: (r) => new Date(r.convertedAt).toLocaleString(),
            sortValue: (r) => r.convertedAt,
          },
        ]}
      />

      <AdminDataTable<QuizCompletionAdminRow>
        title="Quiz completions (intake)"
        description="Intake survey synced into quizzes / quiz_completions / answers."
        rows={data.quizCompletions}
        csvFileName="dearcc-quiz-completions"
        emptyMessage="No quiz completions synced yet. Complete an intake after DATABASE_URL is set."
        columns={[
          { key: "completion_id", label: "Completion ID", render: (r) => r.completionId },
          { key: "user_id", label: "User ID", render: (r) => r.userId },
          { key: "email", label: "Email", render: (r) => r.email },
          { key: "answers", label: "Answers", render: (r) => String(r.answerCount) },
          {
            key: "completed_at",
            label: "Completed",
            render: (r) => new Date(r.completedAt).toLocaleString(),
            sortValue: (r) => r.completedAt,
          },
        ]}
      />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-2xl font-bold text-foreground">{value}</dd>
    </div>
  );
}
