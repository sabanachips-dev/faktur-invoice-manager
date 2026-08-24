import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");
}

const migrationPath = resolve("supabase/migrations/20260823_000001_faktur_schema.sql");
const sql = await readFile(migrationPath, "utf8");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query(sql);
  console.log("Applied Faktur PostgreSQL schema migration successfully.");
} finally {
  await client.end();
}
