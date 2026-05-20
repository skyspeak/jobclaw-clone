import postgres from "postgres";

let sqlClient: ReturnType<typeof postgres> | null = null;
let cachedDatabaseUrl: string | undefined | null = null;

function isValidPostgresUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "postgresql:" || parsed.protocol === "postgres:";
  } catch {
    return false;
  }
}

/** Fix postgresql://user:pass@host when pass contains unencoded @ # ! etc. */
function repairPostgresUrl(url: string) {
  const prefix = "postgresql://";
  if (!url.startsWith(prefix)) {
    return undefined;
  }

  const rest = url.slice(prefix.length);
  const atIndex = rest.lastIndexOf("@");
  if (atIndex < 0) {
    return undefined;
  }

  const credentials = rest.slice(0, atIndex);
  const hostPart = rest.slice(atIndex + 1);
  const colonIndex = credentials.indexOf(":");
  if (colonIndex < 0) {
    return undefined;
  }

  const user = credentials.slice(0, colonIndex);
  const password = credentials.slice(colonIndex + 1);
  const repaired = `${prefix}${user}:${encodeURIComponent(password)}@${hostPart}`;

  return isValidPostgresUrl(repaired) ? repaired : undefined;
}

function buildUrlFromParts() {
  const password = process.env.DATABASE_PASSWORD;
  const host = process.env.DATABASE_HOST;
  if (!password?.trim() || !host?.trim()) {
    return undefined;
  }

  const user = process.env.DATABASE_USER?.trim() || "postgres";
  const port = process.env.DATABASE_PORT?.trim() || "6543";
  const database = process.env.DATABASE_NAME?.trim() || "postgres";

  return `postgresql://${user}:${encodeURIComponent(password.trim())}@${host.trim()}:${port}/${database}`;
}

function resolveDatabaseUrl(): string | undefined {
  const fromParts = buildUrlFromParts();
  if (fromParts && isValidPostgresUrl(fromParts)) {
    return fromParts;
  }

  const raw = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!raw?.trim()) {
    return undefined;
  }

  const trimmed = raw.trim();
  if (isValidPostgresUrl(trimmed)) {
    return trimmed;
  }

  return repairPostgresUrl(trimmed);
}

export function getDatabaseUrl() {
  if (cachedDatabaseUrl === null) {
    cachedDatabaseUrl = resolveDatabaseUrl();
  }

  return cachedDatabaseUrl;
}

export function isDatabaseConfigured() {
  return Boolean(getDatabaseUrl());
}

/** Postgres client tuned for Supabase + Vercel serverless. */
export function getSql() {
  const databaseUrl = getDatabaseUrl();
  if (!databaseUrl) {
    throw new Error("DATABASE_URL or POSTGRES_URL is required for Postgres.");
  }

  if (!sqlClient) {
    const isLocalhost =
      databaseUrl.includes("localhost") || databaseUrl.includes("127.0.0.1");
    const isSupabase = databaseUrl.includes("supabase");
    const usesPooler =
      databaseUrl.includes("pooler.supabase.com") || databaseUrl.includes(":6543");

    sqlClient = postgres(databaseUrl, {
      max: 1,
      ssl: isLocalhost ? false : "require",
      // Required for Supabase transaction pooler (PgBouncer) on Vercel.
      prepare: isLocalhost && !usesPooler && !isSupabase,
      connect_timeout: 30,
      idle_timeout: 20,
    });
  }

  return sqlClient;
}

export function getDatabaseErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Database connection failed.";
  }

  if (error.message.includes("Invalid URL") || (error as NodeJS.ErrnoException).code === "ERR_INVALID_URL") {
    return "DATABASE_URL is malformed. URL-encode special characters in your database password (@ → %40, # → %23, ! → %21), or set DATABASE_HOST + DATABASE_PASSWORD separately on Vercel.";
  }

  if (error.message.includes("password authentication failed")) {
    return "Database password rejected. Reset it in Supabase and update DATABASE_URL on Vercel.";
  }

  if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
    return "Database host not found. Check DATABASE_URL on Vercel (use the Supabase pooler URI for production).";
  }

  if (error.message.includes("Timed out") || error.message.includes("timeout")) {
    return "Database connection timed out. On Vercel, use Supabase Connection string → Transaction pooler (port 6543).";
  }

  return error.message;
}
