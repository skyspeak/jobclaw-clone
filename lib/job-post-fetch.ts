const DEFAULT_JINA_READER_BASE = "https://r.jina.ai/";

export type JobPostFetchResult =
  | { ok: true; text: string; source: "jina" | "direct" }
  | { ok: false; error: string; suggestPaste: boolean };

export function isLikelyJobUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isLinkedInJobUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return host.includes("linkedin.com");
  } catch {
    return false;
  }
}

export async function fetchJobPostingFromUrl(url: string): Promise<JobPostFetchResult> {
  const trimmed = url.trim();

  if (!isLikelyJobUrl(trimmed)) {
    return { ok: false, error: "Enter a valid http or https job posting URL.", suggestPaste: false };
  }

  if (isLinkedInJobUrl(trimmed)) {
    return {
      ok: false,
      error:
        "LinkedIn often blocks automated readers. Paste the job description text instead for the most reliable analysis.",
      suggestPaste: true,
    };
  }

  const jinaResult = await fetchViaJinaReader(trimmed);
  if (jinaResult.ok) {
    return jinaResult;
  }

  const directResult = await fetchViaDirectHtml(trimmed);
  if (directResult.ok) {
    return directResult;
  }

  return {
    ok: false,
    error: jinaResult.ok === false ? jinaResult.error : "Could not read that job posting URL.",
    suggestPaste: true,
  };
}

async function fetchViaJinaReader(url: string): Promise<JobPostFetchResult> {
  const base = (process.env.JINA_READER_BASE_URL ?? DEFAULT_JINA_READER_BASE).replace(/\/$/, "");
  const readerUrl = `${base}/${url}`;

  try {
    const response = await fetch(readerUrl, {
      headers: {
        Accept: "text/plain, text/markdown, */*",
        "X-Return-Format": "markdown",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Could not fetch the posting (${response.status}). Try pasting the description.`,
        suggestPaste: true,
      };
    }

    const text = (await response.text()).trim();

    if (text.length < 120) {
      return {
        ok: false,
        error: "The page returned too little text to analyze. Paste the full job description.",
        suggestPaste: true,
      };
    }

    return { ok: true, text: normalizeJobText(text), source: "jina" };
  } catch {
    return {
      ok: false,
      error: "Could not reach the job posting URL. Paste the description instead.",
      suggestPaste: true,
    };
  }
}

async function fetchViaDirectHtml(url: string): Promise<JobPostFetchResult> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; dear[CC]/1.0; +https://dearcc.org)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
      redirect: "follow",
    });

    if (!response.ok) {
      return {
        ok: false,
        error: `Could not fetch the posting (${response.status}).`,
        suggestPaste: true,
      };
    }

    const html = await response.text();
    const text = stripHtmlToText(html);

    if (text.length < 120) {
      return {
        ok: false,
        error: "Could not extract enough text from that page.",
        suggestPaste: true,
      };
    }

    return { ok: true, text: normalizeJobText(text), source: "direct" };
  } catch {
    return {
      ok: false,
      error: "Could not fetch that URL.",
      suggestPaste: true,
    };
  }
}

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeJobText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

export function resolveJobDescriptionText(input: {
  jobDescription?: string;
  jobUrl?: string;
  fetchedText?: string;
}): { ok: true; text: string } | { ok: false; error: string; suggestPaste?: boolean } {
  const pasted = (input.jobDescription ?? input.fetchedText ?? "").trim();
  if (pasted.length >= 80) {
    return { ok: true, text: normalizeJobText(pasted) };
  }

  const url = (input.jobUrl ?? "").trim();
  if (!url) {
    return {
      ok: false,
      error: "Paste a job description (at least a few sentences) or provide a job posting URL.",
    };
  }

  return {
    ok: false,
    error: "Job description is too short. Paste the full posting or fetch from URL first.",
    suggestPaste: Boolean(url),
  };
}
