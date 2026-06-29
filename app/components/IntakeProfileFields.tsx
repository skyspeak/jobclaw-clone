"use client";

import type { ChangeEvent } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type IntakeProfileFieldsProps = {
  linkedInUrl: string;
  onLinkedInUrlChange: (value: string) => void;
  resumeFileName: string;
  onResumeFile: (event: ChangeEvent<HTMLInputElement>) => void;
  isReadingResume: boolean;
  profileCompleteForGenerate: boolean;
  profileIncompleteHint: string;
};

export function IntakeProfileFields({
  linkedInUrl,
  onLinkedInUrlChange,
  resumeFileName,
  onResumeFile,
  isReadingResume,
  profileCompleteForGenerate,
  profileIncompleteHint,
}: IntakeProfileFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="intake-linkedin-url">LinkedIn profile URL</Label>
        <Input
          id="intake-linkedin-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://www.linkedin.com/in/your-profile"
          className="h-12 rounded-xl text-base sm:h-11"
          data-testid="input-linkedin-url"
          value={linkedInUrl}
          onChange={(e) => onLinkedInUrlChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="intake-resume-upload">Upload résumé (text-based files)</Label>
        <Input
          id="intake-resume-upload"
          type="file"
          accept=".txt,.md,.rtf,.csv,.json"
          className="h-12 cursor-pointer rounded-xl pt-2.5 text-base file:mr-3 sm:h-11"
          data-testid="input-resume-file"
          onChange={onResumeFile}
        />
        {resumeFileName ? (
          <p className="break-all text-xs text-muted-foreground">Uploaded: {resumeFileName}</p>
        ) : null}
        {isReadingResume ? <p className="text-sm text-muted-foreground">Reading file…</p> : null}
        <p className="text-xs text-muted-foreground">
          Plain text (.txt, .md, …). PDF or Word files are not read here—export to text and upload that file.
        </p>
      </div>

      {!profileCompleteForGenerate ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {profileIncompleteHint}
        </p>
      ) : null}
    </div>
  );
}
