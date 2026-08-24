import { Client } from "pg";

if (process.env.CONFIRM_DEMO_CLEANUP !== "DELETE_DEMO_DATA") {
  throw new Error("Set CONFIRM_DEMO_CLEANUP=DELETE_DEMO_DATA to run this cleanup.");
}
const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query("begin");
  const before = {};
  for (const table of ["invoiceActivities", "invoiceItems", "invoices", "clients", "catalogItems"]) {
    before[table] = Number((await client.query(`select count(*)::int as total from public.\"${table}\"`)).rows[0].total);
  }
  await client.query('delete from public."invoiceActivities"');
  await client.query('delete from public."invoiceItems"');
  await client.query('delete from public.invoices');
  await client.query("delete from public.clients where lower(name) not like '%fresh%'");
  const after = {};
  for (const table of ["invoiceActivities", "invoiceItems", "invoices", "clients", "catalogItems"]) {
    after[table] = Number((await client.query(`select count(*)::int as total from public.\"${table}\"`)).rows[0].total);
  }
  await client.query("commit");
  console.log(JSON.stringify({ before, after }));
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
