import { Client } from "pg";

const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const count = async table => Number((await client.query(`select count(*)::int as total from public."${table}"`)).rows[0].total);
  const businessProfiles = await count("businessProfiles");
  const clients = await count("clients");
  const catalogItems = await count("catalogItems");
  const invoices = await count("invoices");
  const invoiceItems = await count("invoiceItems");
  const invoiceActivities = await count("invoiceActivities");
  const { rows: relationRows } = await client.query(`select
    (select count(*)::int from public.invoices i left join public.clients c on c.id = i."clientId" where c.id is null) as invoices_without_client,
    (select count(*)::int from public."invoiceItems" ii left join public.invoices i on i.id = ii."invoiceId" where i.id is null) as items_without_invoice,
    (select count(*)::int from public."invoiceActivities" ia left join public.invoices i on i.id = ia."invoiceId" where i.id is null) as activities_without_invoice`);
  console.log(JSON.stringify({ counts: { businessProfiles, clients, catalogItems, invoices, invoiceItems, invoiceActivities }, relations: relationRows[0] }));
} finally {
  await client.end();
}
