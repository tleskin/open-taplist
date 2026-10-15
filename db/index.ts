import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Lazily create the pool + client on first use so importing this module
// never throws (e.g. during `next build` prerendering when no database URL
// is set). Any actual query will still fail fast with a clear error.
// Accepts DATABASE_URL, falling back to POSTGRES_URL (the variable Vercel
// sets when you attach a Postgres database with the POSTGRES prefix).
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL (or POSTGRES_URL) is not set. Set it in your .env file (see .env.example)."
      );
    }
    const pool = new Pool({ connectionString: url });
    db = drizzle(pool, { schema });
  }
  return db;
}
