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
  contactEmail: string;
  onContactEmailChange: (value: string) => void;
  contactPhone: string;
  onContactPhoneChange: (value: string) => void;
  profileCompleteForGenerate: boolean;
  profileIncompleteHint: string;
};

export function IntakeProfileFields({
  linkedInUrl,
  onLinkedInUrlChange,
  resumeFileName,
  onResumeFile,
  isReadingResume,
  contactEmail,
  onContactEmailChange,
  contactPhone,
  onContactPhoneChange,
  profileCompleteForGenerate,
  profileIncompleteHint,
}: IntakeProfileFieldsProps) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="space-y-2">
          <Label htmlFor="intake-contact-email">Email</Label>
          <Input
            id="intake-contact-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            className="h-11 rounded-xl"
            data-testid="input-contact-email"
            value={contactEmail}
            onChange={(e) => onContactEmailChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="intake-contact-phone">Phone number</Label>
          <Input
            id="intake-contact-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(555) 123-4567"
            className="h-11 rounded-xl"
            data-testid="input-contact-phone"
            value={contactPhone}
            onChange={(e) => onContactPhoneChange(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="intake-linkedin-url">LinkedIn profile URL</Label>
        <Input
          id="intake-linkedin-url"
          type="url"
          inputMode="url"
          autoComplete="url"
          placeholder="https://www.linkedin.com/in/your-profile"
          className="h-11 rounded-xl"
          data-testid="input-linkedin-url"
          value={linkedInUrl}
          onChange={(e) => onLinkedInUrlChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="intake-resume-upload">Upload resume (text-based files)</Label>
        <Input
          id="intake-resume-upload"
          type="file"
          accept=".txt,.md,.rtf,.csv,.json"
          className="h-11 cursor-pointer rounded-xl pt-2.5 file:mr-3"
          data-testid="input-resume-file"
          onChange={onResumeFile}
        />
        {resumeFileName ? (
          <p className="text-xs text-muted-foreground">Uploaded: {resumeFileName}</p>
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
