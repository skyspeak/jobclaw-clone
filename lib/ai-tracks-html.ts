import {
  AI_TRACKS,
  AI_TRACKS_GUIDE_INTRO,
  AI_TRACKS_GUIDE_TITLE,
  AI_TRACKS_PATTERN,
  type AiTrack,
} from "@/lib/ai-tracks-data";

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function p(text: string): string {
  return `<p class="prose">${escapeHtml(text)}</p>`;
}

function trackSection(t: AiTrack): string {
  const deliverRows = t.deliverables
    .map(
      (row) =>
        `<tr><td class="t-name">${escapeHtml(row.name)}</td><td>${escapeHtml(row.description)}</td></tr>`,
    )
    .join("");
  const toolRows = t.tools
    .map(
      (row) =>
        `<tr><td class="t-name">${escapeHtml(row.name)}</td><td>${escapeHtml(row.description)}</td></tr>`,
    )
    .join("");

  return `
    <article class="track" id="${escapeHtml(t.id)}">
      <div class="track-head">
        <span class="pill">Track ${t.number}</span>
        <h2>${escapeHtml(t.title)}</h2>
        <p class="subtitle">${escapeHtml(t.subtitle)}</p>
      </div>
      <p class="bet"><strong>The bet.</strong> ${escapeHtml(t.bet)}</p>
      <div class="weeks">
        <div class="week"><span class="wk">Week 1.</span> ${escapeHtml(t.week1)}</div>
        <div class="week"><span class="wk">Week 2.</span> ${escapeHtml(t.week2)}</div>
      </div>
      <h3>Deliverables</h3>
      <table class="grid"><thead><tr><th>Name</th><th>Description</th></tr></thead><tbody>${deliverRows}</tbody></table>
      <h3>Tool stack</h3>
      <table class="grid"><thead><tr><th>Tool</th><th>What you&apos;ll have done with it</th></tr></thead><tbody>${toolRows}</tbody></table>
      <blockquote class="outcome">&ldquo;${escapeHtml(t.outcomes)}&rdquo;</blockquote>
    </article>
  `;
}

export function buildAiTracksGuideHtml(options: { canonicalUrl?: string } = {}): string {
  const { canonicalUrl = "" } = options;
  const canonicalLink = canonicalUrl
    ? `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`
    : "";

  const intro = AI_TRACKS_GUIDE_INTRO;
  const structureRows = intro.structureRows
    .map(
      (row) =>
        `<tr><td class="t-name">${escapeHtml(row.name)}</td><td>${escapeHtml(row.description)}</td></tr>`,
    )
    .join("");

  const patternRows = AI_TRACKS_PATTERN.rows
    .map(
      (row) =>
        `<tr><td>${escapeHtml(row.sector)}</td><td>${escapeHtml(row.build)}</td><td>${escapeHtml(row.proof)}</td></tr>`,
    )
    .join("");

  const tracksHtml = AI_TRACKS.map(trackSection).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(AI_TRACKS_GUIDE_TITLE)} — JobClaw</title>
  <meta name="description" content="Six two-week solo AI tracks for AI-first roles: artifact + proof document for each." />
  ${canonicalLink}
  <style>
    :root {
      --bg: #fafaf8;
      --card: #ffffff;
      --fg: #0a0a0a;
      --muted: #525252;
      --border: rgba(0,0,0,0.1);
      --primary: hsl(65, 100%, 38%);
      --primary-soft: hsla(65, 100%, 40%, 0.12);
      --radius: 1.25rem;
      --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: var(--font);
      background: var(--bg);
      background-image:
        radial-gradient(at 0% 0%, hsla(65, 100%, 50%, 0.09) 0, transparent 52%),
        radial-gradient(at 100% 100%, hsla(65, 100%, 50%, 0.07) 0, transparent 50%);
      color: var(--fg);
      line-height: 1.55;
      font-size: 16px;
      -webkit-font-smoothing: antialiased;
    }
    .wrap { max-width: 52rem; margin: 0 auto; padding: 2.5rem 1.25rem 4rem; }
    @media (min-width: 640px) { .wrap { padding: 3.5rem 1.75rem 5rem; } }
    .hero {
      padding: 2rem 1.5rem 2.25rem;
      border-radius: calc(var(--radius) + 4px);
      border: 1px solid var(--border);
      background: var(--card);
      box-shadow: 0 1px 0 rgba(0,0,0,0.04);
      margin-bottom: 2.5rem;
    }
    @media (min-width: 640px) { .hero { padding: 2.5rem 2.25rem; } }
    .eyebrow {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: var(--muted);
      margin: 0 0 0.75rem;
    }
    h1 {
      font-size: clamp(1.85rem, 4.5vw, 2.65rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.08;
      margin: 0 0 1rem;
    }
    .hero .prose, .intro-block .prose {
      color: var(--muted);
      margin: 0 0 0.85rem;
      font-size: 0.98rem;
    }
    .hero .prose:last-child { margin-bottom: 0; }
    .intro-block { margin-bottom: 2.75rem; }
    h2 { font-size: 1.35rem; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 0.35rem; }
    h3 { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--muted); margin: 1.5rem 0 0.6rem; }
    .track {
      margin-bottom: 2.5rem;
      padding: 1.75rem 1.35rem 2rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
      box-shadow: 0 1px 0 rgba(0,0,0,0.03);
    }
    @media (min-width: 640px) { .track { padding: 2rem 1.85rem 2.25rem; } }
    .track-head { margin-bottom: 1rem; }
    .pill {
      display: inline-block;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--fg);
      background: var(--primary-soft);
      border: 1px solid hsla(65, 100%, 30%, 0.25);
      padding: 0.28rem 0.65rem;
      border-radius: 999px;
      margin-bottom: 0.65rem;
    }
    .subtitle { font-style: italic; color: var(--muted); margin: 0.25rem 0 0; font-size: 1rem; }
    .bet { font-size: 0.95rem; margin: 0 0 1rem; }
    .weeks { display: grid; gap: 0.85rem; margin-bottom: 0.25rem; }
    .week { font-size: 0.92rem; color: #262626; }
    .wk { font-weight: 700; color: var(--primary); }
    table.grid {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.88rem;
      margin: 0.25rem 0 0.5rem;
    }
    table.grid th, table.grid td {
      border: 1px solid var(--border);
      padding: 0.65rem 0.75rem;
      text-align: left;
      vertical-align: top;
    }
    table.grid th { background: hsla(65, 60%, 96%, 0.9); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
    .t-name { font-weight: 600; white-space: nowrap; max-width: 11rem; }
    blockquote.outcome {
      margin: 1.25rem 0 0;
      padding: 1rem 1.1rem;
      border-left: 4px solid var(--primary);
      background: hsla(65, 55%, 97%, 0.85);
      border-radius: 0 0.5rem 0.5rem 0;
      font-size: 0.92rem;
      color: #1a1a1a;
    }
    .pattern {
      margin-top: 2rem;
      padding: 1.75rem 1.35rem;
      border-radius: var(--radius);
      border: 1px solid var(--border);
      background: var(--card);
    }
    @media (min-width: 640px) { .pattern { padding: 2rem 1.85rem; } }
    .pattern h2 { margin-bottom: 1rem; }
    .foot {
      margin-top: 2rem;
      font-size: 0.82rem;
      color: var(--muted);
      text-align: center;
    }
    a.brand { color: var(--primary); font-weight: 600; text-decoration: none; }
    a.brand:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <p class="eyebrow">JobClaw · AI tracks</p>
      <h1>${escapeHtml(AI_TRACKS_GUIDE_TITLE)}</h1>
      ${p(intro.lead)}
      ${p(intro.throughline)}
    </header>

    <section class="intro-block">
      <h2>${escapeHtml(intro.structureIntro)}</h2>
      <table class="grid" style="margin-top:0.75rem">
        <thead><tr><th>Section</th><th>What it is</th></tr></thead>
        <tbody>${structureRows}</tbody>
      </table>
      ${p(intro.footnote)}
    </section>

    ${tracksHtml}

    <section class="pattern">
      <h2>${escapeHtml(AI_TRACKS_PATTERN.title)}</h2>
      <table class="grid">
        <thead><tr><th>Sector</th><th>The thing you build</th><th>The thing that proves you built it</th></tr></thead>
        <tbody>${patternRows}</tbody>
      </table>
      ${p(AI_TRACKS_PATTERN.closing)}
    </section>

    <p class="foot">
      Generated from JobClaw&apos;s AI tracks guide.
      <a class="brand" href="https://dearcc.org">New Work Foundation</a>
    </p>
  </div>
</body>
</html>`;
}
