import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

let sqlClient: ReturnType<typeof postgres> | null = null;

export function getDatabaseUrl() {
  return databaseUrl;
}

export function isDatabaseConfigured() {
  return Boolean(databaseUrl);
}

/** Postgres client tuned for Supabase + Vercel serverless. */
export function getSql() {
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
    return "DATABASE_URL is malformed. URL-encode special characters in your database password (@ → %40, # → %23, ! → %21).";
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
