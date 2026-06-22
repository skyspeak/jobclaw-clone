"use client";

import Link from "next/link";

import { V2Shell } from "@/app/components/v2/V2Shell";
import type { V2Analysis } from "@/lib/v2/v2-types";

type V2MentorStepProps = {
  analysis: V2Analysis;
  onBack: () => void;
  onRestart: () => void;
};

export function V2MentorStep({ analysis, onBack, onRestart }: V2MentorStepProps) {
  const { mentor } = analysis;
  const firstName = analysis.candidate.name.split(/\s+/)[0] ?? "there";

  return (
    <V2Shell
      step="mentor"
      stepEyebrow="Step 5 of 5 · Someone who has done it"
      title="Your industry mentor."
      subtitle="Every pod is paired with a working professional who has hired for your target role. They show up twice during the six weeks — not to lecture, but to react the way a real hiring manager would."
    >
      <div className="rounded-2xl border border-[var(--v2-border)] bg-[var(--v2-card)] p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-[var(--v2-primary)] text-lg font-semibold text-[var(--v2-primary-fg)]">
            {mentor.initials}
          </div>
          <div>
            <h2 className="v2-serif text-xl font-semibold text-[var(--v2-fg)]">{mentor.name}</h2>
            <p className="mt-1 text-sm text-[var(--v2-muted)]">{mentor.title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {mentor.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--v2-border)] bg-[var(--v2-bg)] px-3 py-0.5 text-xs text-[var(--v2-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <blockquote className="mt-6 border-l-4 border-[var(--v2-accent)] pl-4 text-sm italic leading-relaxed text-[var(--v2-muted)]">
          {mentor.quote}
        </blockquote>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {mentor.sessions.map((session) => (
            <div
              key={session.number}
              className="rounded-xl border border-[var(--v2-border)] bg-[var(--v2-bg)] p-4"
            >
              <div className="flex items-start gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[var(--v2-orange-light)] text-xs font-semibold text-[var(--v2-accent)]">
                  {session.number}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--v2-fg)]">{session.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--v2-muted)]">
                    {session.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl bg-[var(--v2-teal-light)] px-5 py-4 text-sm text-[var(--v2-fg)]">
          <span className="font-semibold">{mentor.firstSessionLabel}</span>
          <span className="text-[var(--v2-muted)]">
            {" "}
            Joins your pod&apos;s weekly call. No prep needed for week one, just show up.
          </span>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-[var(--v2-primary)] p-8 text-[var(--v2-primary-fg)]">
        <h2 className="v2-serif text-2xl font-semibold">That is your roadmap, {firstName}.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed opacity-90">
          A clear read on the gap, a six week plan that ends in proof, five people in your corner,
          and a mentor who has hired for this. The rejection was a starting line.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/v2/week-1"
            className="rounded-full bg-[var(--v2-accent)] px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
          >
            Start week 1
          </Link>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium transition hover:bg-white/10"
          >
            Run it again with another job
          </button>
        </div>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-[var(--v2-border)] bg-[var(--v2-card)] px-5 py-2.5 text-sm font-medium text-[var(--v2-fg)] transition hover:bg-[var(--v2-teal-light)]"
        >
          Back
        </button>
      </div>
    </V2Shell>
  );
}
