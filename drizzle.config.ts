import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Accept either DATABASE_URL or POSTGRES_URL (Vercel's POSTGRES prefix).
    url: process.env.DATABASE_URL || process.env.POSTGRES_URL || "",
  },
});
