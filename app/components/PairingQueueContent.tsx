"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Check, Loader2, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PAIRING_TRACK_DESCRIPTIONS,
  PAIRING_TRACK_LABELS,
  PAIRING_TRACKS,
  pairingTrackToSprintSlug,
} from "@/lib/pairing/constants";
import type { PairingStatusResponse, PairingTrack } from "@/lib/pairing/types";
import { cn } from "@/lib/utils";

export const PAIRING_STORAGE_KEY = "dearcc.pairing.userId";

type Step = "register" | "waiting" | "matched";

export type PairingQueueContentProps = {
  initialTrack?: PairingTrack | null;
  initialEmail?: string;
  lockTrack?: boolean;
  compact?: boolean;
  trackTitle?: string;
  idPrefix?: string;
  restoreSession?: boolean;
};

export function PairingQueueContent({
  initialTrack = null,
  initialEmail,
  lockTrack = false,
  compact = false,
  trackTitle,
  idPrefix = "pairing",
  restoreSession = true,
}: PairingQueueContentProps) {
  const [step, setStep] = useState<Step>("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [track, setTrack] = useState<PairingTrack | "">(initialTrack ?? "");
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<PairingStatusResponse | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTrack) {
      setTrack(initialTrack);
    }
  }, [initialTrack]);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const applyStatus = useCallback((payload: PairingStatusResponse) => {
    setStatus(payload);
    if (payload.status === "matched") {
      setStep("matched");
    } else if (payload.status === "waiting") {
      setStep("waiting");
    }
  }, []);

  const pollStatus = useCallback(
    async (id: string) => {
      const response = await fetch(`/api/pairing/status/${encodeURIComponent(id)}`);
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load status.");
      }
      applyStatus(payload as PairingStatusResponse);
    },
    [applyStatus],
  );

  useEffect(() => {
    if (!restoreSession) {
      return;
    }
    const stored = localStorage.getItem(PAIRING_STORAGE_KEY);
    if (!stored) {
      return;
    }
    setUserId(stored);
    pollStatus(stored).catch(() => {
      localStorage.removeItem(PAIRING_STORAGE_KEY);
      setUserId(null);
    });
  }, [pollStatus, restoreSession]);

  useEffect(() => {
    if (step !== "waiting" || !userId) {
      return;
    }
    const interval = window.setInterval(() => {
      pollStatus(userId).catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(interval);
  }, [step, userId, pollStatus]);

  async function handleRegister(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (!track) {
      setError("Pick a sprint track to join the queue.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/pairing/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, track }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Registration failed.");
      }

      const id = payload.userId as string;
      localStorage.setItem(PAIRING_STORAGE_KEY, id);
      setUserId(id);
      await pollStatus(id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const intro = compact ? (
    <p className="text-sm leading-relaxed text-muted-foreground">
      {trackTitle ? (
        <>
          You committed to <strong className="text-foreground">{trackTitle}</strong>. Match with
          2–4 others on the same sprint track—we&apos;ll share names and emails when your group
          locks.
        </>
      ) : (
        <>
          Match with 2–4 job seekers on the same track. Groups lock at 4 people or after ~10
          minutes (minimum 2).
        </>
      )}
    </p>
  ) : null;

  return (
    <div className={cn("flex flex-col", compact ? "gap-5" : "gap-8")}>
      {intro}

      {step === "register" ? (
        <form
          className={cn(
            "rounded-3xl border border-border/70 bg-card shadow-sm",
            compact ? "p-5" : "p-6 sm:p-8",
          )}
          onSubmit={handleRegister}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Join the queue
          </p>

          {lockTrack && track ? (
            <div className="mt-4 rounded-2xl border border-primary/35 bg-primary/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Your track
              </p>
              <p className="mt-1 font-semibold text-foreground">{PAIRING_TRACK_LABELS[track]}</p>
            </div>
          ) : null}

          <div className={cn("space-y-5", lockTrack && track ? "mt-5" : "mt-6")}>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-name`}>Name</Label>
              <Input
                id={`${idPrefix}-name`}
                className="h-12 rounded-xl text-base"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                required
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}-email`}>Email</Label>
              <Input
                id={`${idPrefix}-email`}
                type="email"
                className="h-12 rounded-xl text-base"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@university.edu"
                required
                autoComplete="email"
              />
            </div>

            {!lockTrack ? (
              <div className="space-y-3">
                <Label>Sprint track</Label>
                <div className="grid gap-3">
                  {PAIRING_TRACKS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTrack(t)}
                      className={cn(
                        "rounded-2xl border p-4 text-left transition",
                        track === t
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/70 bg-background hover:border-primary/30",
                      )}
                    >
                      <p className="font-semibold text-foreground">{PAIRING_TRACK_LABELS[t]}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {PAIRING_TRACK_DESCRIPTIONS[t]}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {error ? <p className="mt-4 text-sm font-medium text-destructive">{error}</p> : null}

          <Button
            type="submit"
            disabled={isSubmitting}
            className={cn("cta-glow h-12 w-full rounded-2xl", compact ? "mt-6" : "mt-8 sm:w-auto sm:px-8")}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining queue…
              </>
            ) : (
              <>
                Join queue <ArrowRight className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      ) : null}

      {step === "waiting" && status?.status === "waiting" ? (
        <div
          className={cn(
            "rounded-3xl border border-primary/35 bg-primary/[0.07] shadow-sm",
            compact ? "p-5" : "p-6 sm:p-8",
          )}
        >
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
            We are building your cohort. Hang tight, we will be in touch over email in the next
            week.
          </p>
        </div>
      ) : null}

      {step === "matched" && status?.status === "matched" ? (
        <div className="space-y-5">
          <div
            className={cn(
              "rounded-3xl border border-primary/35 bg-primary/[0.07] shadow-sm",
              compact ? "p-5" : "p-6 sm:p-8",
            )}
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/15">
              <Check className="size-6 text-primary" strokeWidth={2.25} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              You&apos;re matched
            </p>
            <h2 className={cn("mt-2 font-bold tracking-tight text-foreground", compact ? "text-xl" : "text-2xl")}>
              Your {PAIRING_TRACK_LABELS[status.track]} cohort
            </h2>
          </div>

          <div
            className={cn(
              "rounded-3xl border border-border/70 bg-card shadow-sm",
              compact ? "p-5" : "p-6 sm:p-8",
            )}
          >
            <div className="mb-4 flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">
                {status.members.length} people in your group
              </h3>
            </div>
            <ul className="space-y-3">
              {status.members.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-col gap-1 rounded-2xl border border-border/80 bg-muted/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="font-medium text-foreground">{member.name}</span>
                  <a
                    href={`mailto:${member.email}`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {member.email}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <Button asChild className="cta-glow w-full rounded-2xl sm:w-auto">
            <Link href={`/project-sprints/${pairingTrackToSprintSlug(status.track)}`}>
              Open sprint guide
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
