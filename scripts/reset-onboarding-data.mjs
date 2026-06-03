import { promises as fs } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const TABLES = ["intake_submissions", "job_listings", "job_fit_submissions"];
const JSON_FILES = [
  "intake-submissions.json",
  "track-commits.json",
  "job-listings.json",
  "job-fit-submissions.json",
];

async function loadEnvLocal(cwd) {
  try {
    const envText = await fs.readFile(path.join(cwd, ".env.local"), "utf8");
    for (const line of envText.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }
      const eq = trimmed.indexOf("=");
      if (eq <= 0) {
        continue;
      }
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional for local-only JSON reset
  }
}

async function clearJsonStores(dataDir) {
  for (const file of JSON_FILES) {
    const filePath = path.join(dataDir, file);
    try {
      await fs.access(filePath);
      await fs.writeFile(filePath, "[]\n", "utf8");
      console.log(`cleared ${file}`);
    } catch {
      // file may not exist yet
    }
  }
}

async function clearDatabase(url) {
  const isLocalhost = url.includes("localhost") || url.includes("127.0.0.1");
  const sql = postgres(url, {
    max: 1,
    ssl: isLocalhost ? false : "require",
    prepare: false,
  });

  try {
    for (const table of TABLES) {
      try {
        await sql.unsafe(`truncate table ${table} restart identity cascade`);
        console.log(`truncated ${table}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("does not exist")) {
          console.log(`skipped ${table} (table not created yet)`);
          continue;
        }
        throw error;
      }
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function main() {
  const cwd = process.cwd();
  await loadEnvLocal(cwd);
  await clearJsonStores(path.join(cwd, "data"));

  const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (databaseUrl) {
    await clearDatabase(databaseUrl);
  } else {
    console.log("no DATABASE_URL — postgres skipped");
  }

  console.log("onboarding data reset complete");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
