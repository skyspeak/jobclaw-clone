import postgres from "postgres";

let sqlClient: ReturnType<typeof postgres> | null = null;
let cachedDatabaseUrl: string | undefined | null = null;

function sanitizeEnv(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  let next = value.trim();
  if (
    (next.startsWith('"') && next.endsWith('"')) ||
    (next.startsWith("'") && next.endsWith("'"))
  ) {
    next = next.slice(1, -1).trim();
  }

  return next || undefined;
}

function isValidPostgresUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
      return false;
    }
    return Boolean(parsed.hostname);
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
  const password = sanitizeEnv(process.env.DATABASE_PASSWORD);
  const host = sanitizeEnv(process.env.DATABASE_HOST);
  if (!password || !host) {
    return undefined;
  }

  if (host.includes("://")) {
    return undefined;
  }

  const user = sanitizeEnv(process.env.DATABASE_USER) || "postgres";
  const port = sanitizeEnv(process.env.DATABASE_PORT) || "5432";
  const database = sanitizeEnv(process.env.DATABASE_NAME) || "postgres";

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
}

function resolveDatabaseUrl(): string | undefined {
  const raw = sanitizeEnv(process.env.DATABASE_URL) || sanitizeEnv(process.env.POSTGRES_URL);
  if (raw) {
    if (raw.startsWith("https://") && raw.includes("supabase.co")) {
      return undefined;
    }

    if (isValidPostgresUrl(raw)) {
      return raw;
    }

    const repaired = repairPostgresUrl(raw);
    if (repaired) {
      return repaired;
    }
  }

  const fromParts = buildUrlFromParts();
  if (fromParts && isValidPostgresUrl(fromParts)) {
    return fromParts;
  }

  return undefined;
}

export function getDatabaseUrl() {
  if (cachedDatabaseUrl === null) {
    cachedDatabaseUrl = resolveDatabaseUrl();
  }

  return cachedDatabaseUrl;
}

export type DatabaseDiagnostics = {
  configured: boolean;
  host?: string;
  port?: string;
  user?: string;
  source?: "DATABASE_URL" | "split-env";
};

export function getDatabaseDiagnostics(): DatabaseDiagnostics {
  const url = getDatabaseUrl();
  if (!url) {
    return { configured: false };
  }

  try {
    const parsed = new URL(url);
    const usesSplitEnv = Boolean(
      sanitizeEnv(process.env.DATABASE_HOST) && sanitizeEnv(process.env.DATABASE_PASSWORD),
    );

    return {
      configured: true,
      host: parsed.hostname,
      port: parsed.port || "5432",
      user: decodeURIComponent(parsed.username),
      source: usesSplitEnv ? "split-env" : "DATABASE_URL",
    };
  } catch {
    return { configured: true, host: "(could not parse URL)" };
  }
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
      prepare: isLocalhost && !usesPooler && !isSupabase,
      connect_timeout: 30,
      idle_timeout: 20,
      onnotice: () => {},
    });
  }

  return sqlClient;
}

export function getDatabaseErrorMessage(error: unknown) {
  const diagnostics = getDatabaseDiagnostics();

  if (!(error instanceof Error)) {
    return "Database connection failed.";
  }

  if (error.message.includes("Invalid URL") || (error as NodeJS.ErrnoException).code === "ERR_INVALID_URL") {
    return "DATABASE_URL is malformed. It must start with postgresql:// and use a URL-encoded password, or set DATABASE_HOST + DATABASE_PASSWORD.";
  }

  if (error.message.includes("password authentication failed")) {
    return "Database password rejected. Copy a fresh connection string from Supabase and update Vercel.";
  }

  if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
    const hostHint = diagnostics.host
      ? ` The app tried to reach host “${diagnostics.host}”.`
      : "";
    return `Database host not found.${hostHint} In Vercel, delete extra vars (DATABASE_HOST, etc.), set only DATABASE_URL to the full Supabase URI (postgresql://…), and redeploy.`;
  }

  if (error.message.includes("Timed out") || error.message.includes("timeout")) {
    return "Database connection timed out. Try the other Supabase connection mode (Direct vs pooler) from Project Settings → Database.";
  }

  return error.message;
}
