import { Client } from "pg";

const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) {
  throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");
}

const expectedTables = [
  "users",
  "businessProfiles",
  "clients",
  "catalogItems",
  "invoices",
  "invoiceItems",
  "invoiceActivities",
];

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const tableResult = await client.query(
    `select tablename
       from pg_tables
      where schemaname = 'public'
        and tablename = any($1::text[])
      order by tablename`,
    [expectedTables],
  );
  const actualTables = new Set(tableResult.rows.map(row => row.tablename));
  const missingTables = expectedTables.filter(table => !actualTables.has(table));

  const rlsResult = await client.query(
    `select relname
       from pg_class
      where relnamespace = 'public'::regnamespace
        and relname = any($1::text[])
        and relrowsecurity = true`,
    [expectedTables],
  );
  const rlsTables = new Set(rlsResult.rows.map(row => row.relname));
  const missingRls = expectedTables.filter(table => !rlsTables.has(table));

  if (missingTables.length || missingRls.length) {
    throw new Error(JSON.stringify({ missingTables, missingRls }));
  }

  console.log(JSON.stringify({ tables: expectedTables.length, rls: expectedTables.length }));
} finally {
  await client.end();
}
