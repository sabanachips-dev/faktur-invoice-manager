import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");
const sql = await readFile(resolve("supabase/migrations/20260824_000008_import_invoice_rpc.sql"), "utf8");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  console.log("Applied Supabase import invoice RPC successfully.");
} finally {
  await client.end();
}
