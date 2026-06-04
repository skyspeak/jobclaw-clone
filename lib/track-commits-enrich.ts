import { listLeads } from "@/lib/leads/db";
import type { IntakeSubmission } from "@/lib/submissions";
import {
  listTrackCommits,
  type TrackCommitAdminRow,
  type TrackCommitRecord,
} from "@/lib/track-commits";

function linkedInLookupFromSubmissions(submissions: IntakeSubmission[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const submission of submissions) {
    const email = submission.contact.email?.trim().toLowerCase();
    const linkedIn = submission.resumeSnapshot?.linkedInUrl?.trim();
    if (email && linkedIn && !map.has(email)) {
      map.set(email, linkedIn);
    }
  }

  return map;
}

async function linkedInLookupFromLeads(): Promise<Map<string, string>> {
  const map = new Map<string, string>();

  try {
    const leads = await listLeads();
    for (const lead of leads) {
      const email = lead.email.trim().toLowerCase();
      const linkedIn = lead.linkedin?.trim();
      if (email && linkedIn && !map.has(email)) {
        map.set(email, linkedIn);
      }
    }
  } catch {
    // Leads DB may be unset in some environments.
  }

  return map;
}

function enrichCommits(
  commits: TrackCommitRecord[],
  submissionLinkedIn: Map<string, string>,
  leadLinkedIn: Map<string, string>,
): TrackCommitAdminRow[] {
  return commits.map((commit) => {
    const email = commit.email.trim().toLowerCase();
    const linkedIn = submissionLinkedIn.get(email) ?? leadLinkedIn.get(email) ?? null;
    return { ...commit, linkedIn };
  });
}

export async function listTrackCommitsForAdmin(
  submissions: IntakeSubmission[],
): Promise<TrackCommitAdminRow[]> {
  const [commits, leadLinkedIn] = await Promise.all([
    listTrackCommits(),
    linkedInLookupFromLeads(),
  ]);
  const submissionLinkedIn = linkedInLookupFromSubmissions(submissions);
  return enrichCommits(commits, submissionLinkedIn, leadLinkedIn);
}
