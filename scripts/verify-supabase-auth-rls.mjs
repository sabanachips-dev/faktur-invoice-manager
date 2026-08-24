import { Client } from "pg";

const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");

const expectedPolicies = [
  "users_select_own",
  "users_update_own",
  "business_profiles_own",
  "clients_own",
  "catalog_items_own",
  "invoices_own",
  "invoice_items_own",
  "invoice_activities_own",
];

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const result = await client.query(
    "select policyname from pg_policies where schemaname = 'public' and policyname = any($1::text[])",
    [expectedPolicies],
  );
  const actual = new Set(result.rows.map(row => row.policyname));
  const missing = expectedPolicies.filter(policy => !actual.has(policy));
  const functions = await client.query(
    "select to_regprocedure('public.handle_auth_user_created()') is not null as auth_trigger_fn, to_regprocedure('public.current_faktur_user_id()') is not null as current_user_fn",
  );
  if (missing.length || !functions.rows[0].auth_trigger_fn || !functions.rows[0].current_user_fn) {
    throw new Error(JSON.stringify({ missing, functions: functions.rows[0] }));
  }
  console.log(JSON.stringify({ policies: expectedPolicies.length, functions: 2 }));
} finally {
  await client.end();
}
