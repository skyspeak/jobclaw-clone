"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";

import { IntakeOptionChips } from "@/app/components/IntakeOptionChips";
import { IntakeProfileFields } from "@/app/components/IntakeProfileFields";
import {
  CC_AGENT_ROLE_LABELS,
  NURTURE_TRACK_COPY,
  VETTED_ROLE_IDS,
  type NurtureTrackId,
  type VettingResult,
} from "@/lib/cc-agent-flow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export function IntakeHookPanel({
  knowsTargetJob,
  onKnowsTargetJobChange,
  usWorkEligible,
  onUsWorkEligibleChange,
}: {
  knowsTargetJob: boolean | null;
  onKnowsTargetJobChange: (value: boolean) => void;
  usWorkEligible: boolean;
  onUsWorkEligibleChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <IntakeOptionChips
        options={["Yes, I have a target job in mind", "Not yet — help me figure it out"]}
        value={
          knowsTargetJob === true
            ? "Yes, I have a target job in mind"
            : knowsTargetJob === false
              ? "Not yet — help me figure it out"
              : ""
        }
        onChange={(value) => {
          onKnowsTargetJobChange(value.startsWith("Yes"));
        }}
        stepIndex={0}
      />
      <div className="flex flex-row items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-4">
        <div className="space-y-0.5 pr-4">
          <Label className="text-sm">US work eligibility (MVP)</Label>
          <p className="text-xs text-muted-foreground">
            CC Agent MVP is US-only with no visa sponsorship cases.
          </p>
        </div>
        <Switch
          checked={usWorkEligible}
          onCheckedChange={onUsWorkEligibleChange}
          data-testid="switch-us-eligible"
        />
      </div>
      {knowsTargetJob === null ? (
        <p className="text-sm text-muted-foreground">Choose an option above to continue.</p>
      ) : null}
      {!usWorkEligible ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          Confirm US work eligibility to use CC Agent vetting for this pilot.
        </p>
      ) : null}
    </div>
  );
}

export function IntakeTargetJobPanel({
  targetJobUrl,
  onTargetJobUrlChange,
}: {
  targetJobUrl: string;
  onTargetJobUrlChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor="intake-target-job-url">Target job posting URL</Label>
      <Input
        id="intake-target-job-url"
        type="url"
        inputMode="url"
        placeholder="https://…"
        className="h-11 rounded-xl"
        data-testid="input-target-job-url"
        value={targetJobUrl}
        onChange={(e) => onTargetJobUrlChange(e.target.value)}
      />
      <p className="text-xs text-muted-foreground">
        Paste a LinkedIn, Greenhouse, or company careers link. We&apos;ll parse required skills for gap analysis.
      </p>
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

export function IntakeVettingResultPanel({ vetting }: { vetting: VettingResult }) {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-foreground">{vetting.summary}</p>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Vetted</dt>
          <dd className="mt-1 font-medium text-foreground">{vetting.vetted ? "Yes" : "Not yet"}</dd>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Target role</dt>
          <dd className="mt-1 font-medium text-foreground">{vetting.inferredRoleLabel}</dd>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Profile</dt>
          <dd className="mt-1 font-medium text-foreground">
            {vetting.profileStrength === "strong" ? "Strong match" : "Gap to close"}
          </dd>
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Signals</dt>
          <dd className="mt-1 text-muted-foreground">
            {vetting.quantitativeSignal ? "Quantitative ✓" : "Add education/impact signals"} ·{" "}
            {vetting.roleVetted ? "Role ✓" : "Role outside MVP set"}
          </dd>
        </div>
      </dl>
      {vetting.vetted ? (
        <p className="text-xs text-muted-foreground">
          Mentorship unlocks after your 4-week team proof-of-work sprint (1 mentor : 4 peers).
        </p>
      ) : null}
    </div>
  );
}

export function IntakeNurtureTrackPanel({ trackId }: { trackId: NurtureTrackId }) {
  const copy = NURTURE_TRACK_COPY[trackId];

  return (
    <div className="space-y-4">
      <p className="font-medium text-foreground">{copy.title}</p>
      <p className="text-sm leading-relaxed text-muted-foreground">{copy.description}</p>
      <p className="text-xs text-muted-foreground">
        Proof-of-work: 4-week sprint, public GitHub + demo + writeup, daily standup bot, weekly mentor checkpoint
        (vetted track).
      </p>
      <Link
        href={copy.ctaHref}
        className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
      >
        {copy.ctaLabel} →
      </Link>
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
