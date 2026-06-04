"use client";

import type { ChangeEvent } from "react";

import { IntakeGapParametersTable } from "@/app/components/IntakeGapParametersTable";
import { IntakeOptionChips } from "@/app/components/IntakeOptionChips";
import { IntakeProfileFields } from "@/app/components/IntakeProfileFields";
import {
  CC_AGENT_ROLE_LABELS,
  DREAM_JOB_SKIP_CHIP,
  PROFILE_SKIP_CHIP,
  VETTED_ROLE_IDS,
  type VettedRoleId,
  type VettingResult,
} from "@/lib/cc-agent-flow";
import { BRAND_NAME } from "@/lib/brand";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <Label htmlFor="intake-target-job-url">Dream job URL</Label>
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
          Paste a LinkedIn, Greenhouse, or company careers link. We&apos;ll parse required skills for gap analysis.
        </p>
      </div>
      <IntakeOptionChips
        options={[DREAM_JOB_SKIP_CHIP]}
        value={noDreamJob ? DREAM_JOB_SKIP_CHIP : ""}
        onChange={() => onNoDreamJob()}
        stepIndex={0}
      />
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
  const targetJobLabel = targetJobUrl.trim() || vetting.inferredRoleLabel;
  const resumeLabel = [
    linkedInUrl.trim() ? `LinkedIn: ${linkedInUrl.trim()}` : null,
    resumeFileName.trim() ? `Résumé: ${resumeFileName.trim()}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Target job</p>
        <p className="text-sm leading-relaxed text-foreground">{targetJobLabel}</p>
      </div>

      <div className="space-y-3 border-y border-border/60 py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Profile gaps
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            missing · good · stretch — scored against your target role
          </p>
        </div>
        <IntakeGapParametersTable parameters={vetting.gapParameters ?? []} />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Résumé</p>
        <p className="text-sm leading-relaxed text-foreground">
          {resumeLabel || "No résumé or LinkedIn on file yet."}
        </p>
      </div>
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
