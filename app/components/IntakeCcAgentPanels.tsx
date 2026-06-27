"use client";

import type { ChangeEvent } from "react";

import { IntakeAnalysisCompleteBanner } from "@/app/components/IntakeAnalysisCompleteBanner";
import { IntakeGapParametersTable } from "@/app/components/IntakeGapParametersTable";
import { IntakeOptionChips } from "@/app/components/IntakeOptionChips";
import { IntakeProfileFields } from "@/app/components/IntakeProfileFields";
import {
  CC_AGENT_ROLE_LABELS,
  DREAM_JOB_SKIP_CHIP,
  NURTURE_TRACK_COPY,
  PROFILE_SKIP_CHIP,
  VETTED_ROLE_IDS,
  type NurtureTrackId,
  type VettedRoleId,
  type VettingResult,
} from "@/lib/cc-agent-flow";
import {
  AI_PROJECT_SPRINTS,
  projectSprintPath,
  projectSprintPathForRoleId,
  type ProjectSprintSlug,
} from "@/lib/ai-tracks-data";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function IntakeConnectPanel({
  targetJobUrl,
  onTargetJobUrlChange,
  onNoDreamJob,
  linkedInUrl,
  onLinkedInUrlChange,
  resumeFileName,
  onResumeFile,
  isReadingResume,
  skippedProfileUpload,
  onSkipProfileUpload,
}: {
  targetJobUrl: string;
  onTargetJobUrlChange: (value: string) => void;
  onNoDreamJob: () => void;
  linkedInUrl: string;
  onLinkedInUrlChange: (value: string) => void;
  resumeFileName: string;
  onResumeFile: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadingResume: boolean;
  skippedProfileUpload: boolean;
  onSkipProfileUpload: () => void;
}) {
  const hasProfile = Boolean(linkedInUrl.trim() || resumeFileName);

  return (
    <div className="space-y-6">
      <IntakeDreamJobPanel
        targetJobUrl={targetJobUrl}
        onTargetJobUrlChange={onTargetJobUrlChange}
        noDreamJob={false}
        onNoDreamJob={onNoDreamJob}
      />
      <div className="border-t border-border/60 pt-6">
        <IntakeProfileFields
          linkedInUrl={linkedInUrl}
          onLinkedInUrlChange={onLinkedInUrlChange}
          resumeFileName={resumeFileName}
          onResumeFile={onResumeFile}
          isReadingResume={isReadingResume}
          profileCompleteForGenerate={hasProfile}
          profileIncompleteHint=""
        />
        <div className="mt-4">
          <IntakeOptionChips
            options={[PROFILE_SKIP_CHIP]}
            value={skippedProfileUpload ? PROFILE_SKIP_CHIP : ""}
            onChange={() => onSkipProfileUpload()}
            stepIndex={0}
          />
        </div>
      </div>
    </div>
  );
}

export function IntakeJourneyPanel({ vetting }: { vetting: VettingResult }) {
  const nurture = NURTURE_TRACK_COPY[vetting.nurtureTrack as NurtureTrackId];
  const recommendedHref = projectSprintPathForRoleId(vetting.inferredRoleId);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-lg font-semibold tracking-tight text-foreground">
          Become AI native by honing your skills
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{nurture.description}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { value: "6 weeks", label: "Project sprint" },
          { value: "3 tracks", label: "Role-matched builds" },
          { value: "1 artifact", label: "Proof for your next application" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-center"
          >
            <p className="text-lg font-semibold text-foreground">{stat.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          AI-native project sprints
        </p>
        {AI_PROJECT_SPRINTS.map((sprint) => {
          const slug = (sprint.slug ?? sprint.id) as ProjectSprintSlug;
          const href = projectSprintPath(slug);
          const isRecommended = href === recommendedHref;

          return (
            <Link
              key={sprint.id}
              href={href}
              className={cn(
                "block rounded-2xl border p-4 transition-colors hover:bg-muted/30",
                isRecommended
                  ? "border-primary/40 bg-primary/[0.06]"
                  : "border-border/70 bg-card",
              )}
            >
              <p className="font-semibold text-foreground">{sprint.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">{sprint.subtitle}</p>
              {isRecommended ? (
                <p className="mt-2 text-xs font-semibold text-primary">Recommended for your target role</p>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function IntakeProfileUploadPanel({
  linkedInUrl,
  onLinkedInUrlChange,
  resumeFileName,
  resumeText,
  onResumeFile,
  isReadingResume,
  skippedProfileUpload,
  onSkipProfileUpload,
}: {
  linkedInUrl: string;
  onLinkedInUrlChange: (value: string) => void;
  resumeFileName: string;
  resumeText: string;
  onResumeFile: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadingResume: boolean;
  skippedProfileUpload: boolean;
  onSkipProfileUpload: () => void;
}) {
  const hasProfile = Boolean(linkedInUrl.trim() || resumeText.trim() || resumeFileName);

  return (
    <div className="space-y-4">
      <IntakeProfileFields
        linkedInUrl={linkedInUrl}
        onLinkedInUrlChange={onLinkedInUrlChange}
        resumeFileName={resumeFileName}
        onResumeFile={onResumeFile}
        isReadingResume={isReadingResume}
        profileCompleteForGenerate={hasProfile}
        profileIncompleteHint=""
      />
      <IntakeOptionChips
        options={[PROFILE_SKIP_CHIP]}
        value={skippedProfileUpload ? PROFILE_SKIP_CHIP : ""}
        onChange={() => onSkipProfileUpload()}
        stepIndex={0}
      />
      {skippedProfileUpload ? (
        <p className="text-sm text-muted-foreground">
          You can still continue — we&apos;ll lean on your quiz answers and role picks for now.
        </p>
      ) : null}
    </div>
  );
}

export function IntakeDreamJobPanel({
  targetJobUrl,
  onTargetJobUrlChange,
  noDreamJob,
  onNoDreamJob,
}: {
  targetJobUrl: string;
  onTargetJobUrlChange: (value: string) => void;
  noDreamJob: boolean;
  onNoDreamJob: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="intake-target-job-url">Job listing URL</Label>
        <Input
          id="intake-target-job-url"
          type="url"
          inputMode="url"
          placeholder="https://…"
          className="h-11 rounded-xl"
          data-testid="input-target-job-url"
          value={targetJobUrl}
          disabled={noDreamJob}
          onChange={(e) => onTargetJobUrlChange(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          LinkedIn, Greenhouse, or company careers links work best.
        </p>
        <button
          type="button"
          onClick={onNoDreamJob}
          data-testid="link-no-job-url"
          className={cn(
            "text-xs underline underline-offset-2 transition-colors",
            noDreamJob
              ? "font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {DREAM_JOB_SKIP_CHIP}
        </button>
      </div>
    </div>
  );
}

export function IntakeRoleSuggestionsPanel({
  roleSuggestions,
  selectedRoleId,
  onSelectRole,
}: {
  roleSuggestions: string[];
  selectedRoleId: string;
  onSelectRole: (roleId: string, label: string) => void;
}) {
  const chips = roleSuggestions.length
    ? roleSuggestions
    : Object.values(CC_AGENT_ROLE_LABELS);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        MVP vetted roles: Sales, Marketing, Forward Deployed Engineer, Software Engineer. Tap one to set your
        track.
      </p>
      <div className="flex flex-wrap gap-2">
        {VETTED_ROLE_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onSelectRole(id, CC_AGENT_ROLE_LABELS[id])}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              selectedRoleId === id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
            data-testid={`role-chip-${id}`}
          >
            {CC_AGENT_ROLE_LABELS[id]}
          </button>
        ))}
      </div>
      {chips.map((label) => {
        const matchedId = VETTED_ROLE_IDS.find(
          (id) => CC_AGENT_ROLE_LABELS[id].toLowerCase() === label.toLowerCase(),
        );
        if (matchedId) {
          return null;
        }
        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelectRole("long-tail", label)}
            className="mr-2 rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
          >
            {label}
          </button>
        );
      })}
      {!selectedRoleId ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          Select a role to continue.
        </p>
      ) : null}
    </div>
  );
}

export function IntakeVettingSourceLinks({
  targetJobUrl,
  linkedInUrl,
  fallbackRoleLabel,
}: {
  targetJobUrl: string;
  linkedInUrl: string;
  fallbackRoleLabel?: string;
}) {
  const targetJobLabel = targetJobUrl.trim() || fallbackRoleLabel || "—";
  const linkedInLabel = linkedInUrl.trim() || "—";

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Target job
        </p>
        <p className="break-all text-sm leading-relaxed text-foreground">{targetJobLabel}</p>
      </div>
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          LinkedIn
        </p>
        <p className="break-all text-sm leading-relaxed text-foreground">{linkedInLabel}</p>
      </div>
    </div>
  );
}

export function IntakeVettingResultPanel({
  vetting,
  targetJobUrl,
  linkedInUrl,
  resumeFileName,
}: {
  vetting: VettingResult;
  targetJobUrl: string;
  linkedInUrl: string;
  resumeFileName: string;
}) {
  return (
    <div className="space-y-5">
      <IntakeAnalysisCompleteBanner />
      <IntakeGapParametersTable parameters={vetting.gapParameters ?? []} />

      <IntakeVettingSourceLinks
        targetJobUrl={targetJobUrl}
        linkedInUrl={linkedInUrl}
        fallbackRoleLabel={vetting.inferredRoleLabel}
      />

      {resumeFileName.trim() ? (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Résumé
          </p>
          <p className="text-sm leading-relaxed text-foreground">{resumeFileName.trim()}</p>
        </div>
      ) : null}
    </div>
  );
}

export function IntakeResumePanel(props: {
  linkedInUrl: string;
  onLinkedInUrlChange: (value: string) => void;
  resumeFileName: string;
  resumeText: string;
  onResumeFile: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadingResume: boolean;
  profileCompleteForGenerate: boolean;
  profileIncompleteHint: string;
  showLinkedIn?: boolean;
}) {
  if (props.showLinkedIn === false) {
    const hasResume = Boolean(props.resumeText.trim() || props.resumeFileName);
    return (
      <div className="space-y-2">
        <Label htmlFor="intake-resume-upload-only">Upload résumé (text-based files)</Label>
        <Input
          id="intake-resume-upload-only"
          type="file"
          accept=".txt,.md,.rtf,.csv,.json"
          className="h-11 cursor-pointer rounded-xl pt-2.5 file:mr-3"
          data-testid="input-resume-file"
          onChange={props.onResumeFile}
        />
        {props.resumeFileName ? (
          <p className="text-xs text-muted-foreground">Uploaded: {props.resumeFileName}</p>
        ) : null}
        {props.isReadingResume ? <p className="text-sm text-muted-foreground">Reading file…</p> : null}
        {!hasResume ? (
          <p className="text-sm font-medium text-destructive" role="alert">
            Upload a text-based résumé to continue.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <IntakeProfileFields
      linkedInUrl={props.linkedInUrl}
      onLinkedInUrlChange={props.onLinkedInUrlChange}
      resumeFileName={props.resumeFileName}
      onResumeFile={props.onResumeFile}
      isReadingResume={props.isReadingResume}
      profileCompleteForGenerate={props.profileCompleteForGenerate}
      profileIncompleteHint={props.profileIncompleteHint}
    />
  );
}
