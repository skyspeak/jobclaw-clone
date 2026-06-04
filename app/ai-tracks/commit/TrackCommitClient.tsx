"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";

import { PairingQueueContent, PAIRING_STORAGE_KEY } from "@/app/components/PairingQueueContent";
import { ProjectSprintNav } from "@/app/components/ProjectSprintNav";
import { isValidEmail, isValidPhone } from "@/lib/ai-tracks-commit";
import type { AiTrack } from "@/lib/ai-tracks-data";
import { PROJECT_SPRINT_SLUGS, projectSprintPath, type ProjectSprintSlug } from "@/lib/ai-tracks-data";
import { aiTrackToPairingTrack } from "@/lib/pairing/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TrackCommitClientProps = {
  track: AiTrack;
};

type CommitSuccess = {
  email: string;
  phone: string;
  name: string;
  pairingUserId: string | null;
};

function sprintSlugForTrack(track: AiTrack): ProjectSprintSlug | null {
  const slug = track.slug ?? track.id;
  return PROJECT_SPRINT_SLUGS.includes(slug as ProjectSprintSlug)
    ? (slug as ProjectSprintSlug)
    : null;
}

export function TrackCommitClient({ track }: TrackCommitClientProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<CommitSuccess | null>(null);

  const pairingTrack = useMemo(() => aiTrackToPairingTrack(track), [track]);
  const sprintSlug = useMemo(() => sprintSlugForTrack(track), [track]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Enter your name.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

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
          name: trimmedName,
          email: email.trim(),
          phone: phone.trim(),
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save your commitment.");
      }

      const pairingUserId =
        typeof payload?.cohort?.userId === "string" ? payload.cohort.userId : null;

      if (pairingUserId) {
        localStorage.setItem(PAIRING_STORAGE_KEY, pairingUserId);
      }

      setSuccess({
        email: email.trim(),
        phone: phone.trim(),
        name: trimmedName,
        pairingUserId,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (success) {
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
            We&apos;ll be in touch at <strong className="text-foreground">{success.email}</strong> with next steps for
            your two-week sprint.
            {pairingTrack ? (
              <>
                {" "}
                You&apos;re also queued for a sprint cohort of up to four people on the same track.
              </>
            ) : null}
          </p>
        </div>

        {pairingTrack && success.pairingUserId ? (
          <PairingQueueContent
            initialTrack={pairingTrack}
            initialEmail={success.email}
            initialUserId={success.pairingUserId}
            lockTrack
            compact
            trackTitle={track.title}
            restoreSession={false}
          />
        ) : null}

        {sprintSlug ? (
          <ProjectSprintNav sprintSlug={sprintSlug} sprintTitle={track.title} />
        ) : (
          <Button variant="ghost" asChild className="rounded-2xl">
            <Link href="/">Home</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <form className="space-y-8" onSubmit={handleSubmit}>
      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Your track
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">{track.title}</h2>
        <p className="mt-1 text-base italic text-muted-foreground">{track.subtitle}</p>
      </div>

      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-sm sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          How to reach you
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll use your email for sprint and cohort updates and your phone for reminders during your two-week
          build. Confirming also places you in a cohort queue (up to four people per group).
        </p>
        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="commit-name" className="text-sm font-semibold">
              Name
            </Label>
            <Input
              id="commit-name"
              type="text"
              autoComplete="name"
              placeholder="Alex Chen"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-12 rounded-xl text-base"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commit-email" className="text-sm font-semibold">
              Email
            </Label>
            <Input
              id="commit-email"
              type="email"
              autoComplete="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-xl text-base"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commit-phone" className="text-sm font-semibold">
              Phone number
            </Label>
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
          </div>
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
        {sprintSlug ? (
          <Button type="button" variant="outline" asChild className="h-12 rounded-2xl">
            <Link href={projectSprintPath(sprintSlug)}>Back to sprint</Link>
          </Button>
        ) : (
          <Button type="button" variant="outline" asChild className="h-12 rounded-2xl">
            <Link href="/ai-tracks">Choose a different track</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
