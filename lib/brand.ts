/** User-facing product name. Internal package/types may still use legacy identifiers. */
export const BRAND_NAME = "dear[CC]";

export const BRAND_PAGE_TITLE = `${BRAND_NAME} — Land your first job`;

export const BRAND_TAGLINE = "Career signal, on demand";

export const BRAND_AGENT_LABEL = BRAND_NAME;

/** Public YouTube channel — @dearCChq */
export const BRAND_YOUTUBE_URL =
  process.env.NEXT_PUBLIC_DEARCC_YOUTUBE_URL?.trim() || "https://www.youtube.com/@dearCChq";
