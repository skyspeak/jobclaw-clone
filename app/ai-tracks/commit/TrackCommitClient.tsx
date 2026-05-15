"use client";

import Link from "next/link";
import { useState } from "react";
import { Calendar, Check } from "lucide-react";

import { buildTrackCommitCalendarUrl, isValidPhone, type TrackCommitCalendar } from "@/lib/ai-tracks-commit";
import type { AiTrack } from "@/lib/ai-tracks-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TrackCommitClientProps = {
  track: AiTrack;
};

type CommitSuccess = {
  calendar: TrackCommitCalendar;
  phone: string;
};

export function TrackCommitClient({ track }: TrackCommitClientProps) {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<CommitSuccess | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!isValidPhone(phone)) {
      setError("Enter a valid phone number (at least 10 digits).");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/track-commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trackId: track.id,
          trackTitle: track.title,
          phone: phone.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save your commitment.");
      }

      const calendar = buildTrackCommitCalendarUrl(track);
      setSuccess({ calendar, phone: phone.trim() });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
    const { calendar } = success;

    return (
      <div className="space-y-8">
        <div className="rounded-3xl border border-primary/35 bg-primary/[0.07] p-6 sm:p-8">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15">
            <Check className="size-6 text-primary" strokeWidth={2.25} />
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            You&apos;re in
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Committed to {track.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Your two-week window runs from <strong className="text-foreground">{calendar.startLabel}</strong>{" "}
            through <strong className="text-foreground">{calendar.finishLabel}</strong>. Add it to your calendar so
            the finish line stays visible.
          </p>
        </div>

        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Confirm on your calendar
          </p>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Opens Google Calendar with a two-week event for this track. You can edit reminders after you add it.
          </p>
          <Button asChild size="lg" className="cta-glow h-12 w-full rounded-2xl sm:w-auto sm:px-8">
            <a href={calendar.url} rel="noreferrer" target="_blank">
              <Calendar className="size-5" />
              Add to Google Calendar
            </a>
          </Button>
          <p className="mt-4 text-xs text-muted-foreground">
            Finish line: {calendar.finishLabel} (14 days from today)
          </p>
        </div>

        <Button variant="outline" asChild className="rounded-2xl">
          <Link href="/ai-tracks">Back to all tracks</Link>
        </Button>
      </div>
    );
  }

  const preview = buildTrackCommitCalendarUrl(track);

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Your track
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{track.title}</h2>
        <p className="mt-1 text-base italic text-muted-foreground">{track.subtitle}</p>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Committing today means your finish line is{" "}
          <strong className="text-foreground">{preview.finishLabel}</strong>.
        </p>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <div className="space-y-3">
          <Label htmlFor="commit-phone" className="text-sm font-semibold">
            Phone number
          </Label>
          <p className="text-sm text-muted-foreground">
            So we can reach you with reminders or office-hours invites during your two-week build.
          </p>
          <Input
            id="commit-phone"
            type="tel"
            autoComplete="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="h-12 rounded-xl text-base"
            required
          />
          {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="cta-glow h-12 rounded-2xl sm:min-w-[220px]"
        >
          {isSubmitting ? "Saving…" : "Confirm my commitment"}
        </Button>
        <Button type="button" variant="outline" asChild className="h-12 rounded-2xl">
          <Link href="/ai-tracks">Choose a different track</Link>
        </Button>
      </div>
    </form>
  );
}
