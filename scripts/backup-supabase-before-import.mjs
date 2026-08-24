import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");

const tables = ["users", "businessProfiles", "clients", "catalogItems", "invoices", "invoiceItems", "invoiceActivities"];
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const data = {};
  for (const table of tables) {
    const { rows } = await client.query(`select * from public."${table}" order by id asc`);
    data[table] = rows;
  }
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const directory = "/home/ubuntu/faktur-migration-backups";
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `supabase-before-import-${timestamp}.json`);
  await writeFile(path, JSON.stringify({ createdAt: new Date().toISOString(), tables: data }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ path, counts: Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, rows.length])) }));
} finally {
  await client.end();
}
