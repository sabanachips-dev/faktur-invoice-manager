import { Client } from "pg";

const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const result = await client.query(
    `select count(*)::int as profiles,
            count("authUserId")::int as auth_linked_profiles
       from public.users`,
  );
  const profile = result.rows[0];
  if (profile.auth_linked_profiles < 1) throw new Error("No Supabase Auth profile was created.");
  console.log(JSON.stringify(profile));
} finally {
  await client.end();
}
