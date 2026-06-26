import Link from "next/link";

export default function V3WeekOnePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--v3-accent)]">
        Week 1 · Analytics
      </p>
      <h1 className="v3-serif mt-3 text-4xl font-semibold tracking-tight text-[var(--v3-fg)]">
        Speak the language of results.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--v3-muted)]">
        Start with GA4 certification, SQL basics for marketers, and rewriting one resume bullet
        with a real metric. Your pod and mentor sessions pick up from here.
      </p>
      <Link
        href="/v3"
        className="mt-8 inline-flex w-fit rounded-full bg-[var(--v3-primary)] px-6 py-3 text-sm font-medium text-[var(--v3-primary-fg)] transition hover:opacity-90"
      >
        Back to roadmap
      </Link>
    </main>
  );
}
