import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Lazily create the pool + client on first use so importing this module
// never throws (e.g. during `next build` prerendering when DATABASE_URL
// is unset). Any actual query will still fail fast with a clear error.
let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!db) {
    const url = process.env.DATABASE_URL;
    if (!url) {
      throw new Error(
        "DATABASE_URL is not set. Set it in your .env file (see .env.example)."
      );
    }
    const pool = new Pool({ connectionString: url });
    db = drizzle(pool, { schema });
  }
  return db;
}
