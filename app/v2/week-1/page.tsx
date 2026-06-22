import Link from "next/link";

export default function V2WeekOnePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--v2-accent)]">
        Week 1 · Analytics
      </p>
      <h1 className="v2-serif mt-3 text-4xl font-semibold tracking-tight text-[var(--v2-fg)]">
        Your six-week journey starts here.
      </h1>
      <p className="mt-4 text-base leading-relaxed text-[var(--v2-muted)]">
        Week 1 focuses on speaking the language of results — GA4 basics, SQL for marketers, and
        rewriting one resume bullet with a real metric. More content coming soon.
      </p>
      <Link
        href="/v2"
        className="mt-8 inline-flex w-fit rounded-full bg-[var(--v2-primary)] px-6 py-3 text-sm font-medium text-[var(--v2-primary-fg)] transition hover:opacity-90"
      >
        Back to roadmap
      </Link>
    </main>
  );
}
