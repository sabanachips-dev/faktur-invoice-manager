import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Client } from "pg";

const sourcePath = process.argv[2];
if (!sourcePath) throw new Error("Usage: node scripts/transform-source-for-single-supabase-user.mjs <source-export-path>");
const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");

const source = JSON.parse(await readFile(sourcePath, "utf8"));
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const { rows: targetUsers } = await client.query('select id, "authUserId" from public.users order by id asc');
  if (targetUsers.length !== 1) throw new Error(`Expected exactly one Supabase target user, found ${targetUsers.length}.`);
  const targetUserId = targetUsers[0].id;
  const invoiceCountByOwner = new Map(source.tables.invoices.reduce((counts, row) => counts.set(row.userId, (counts.get(row.userId) || 0) + 1), new Map()));
  const sourceProfiles = [...source.tables.businessProfiles].sort((a, b) => (invoiceCountByOwner.get(b.userId) || 0) - (invoiceCountByOwner.get(a.userId) || 0));
  const primaryProfile = sourceProfiles[0] || null;
  const invoiceIds = new Set(source.tables.invoices.map(row => row.id));
  const validActivities = source.tables.invoiceActivities.filter(row => invoiceIds.has(row.invoiceId));
  const orphanInvoiceActivities = source.tables.invoiceActivities.filter(row => !invoiceIds.has(row.invoiceId));
  const mapOwner = row => ({ ...row, userId: targetUserId });
  const transformed = {
    createdAt: new Date().toISOString(),
    targetUserId,
    primaryBusinessProfileSourceUserId: primaryProfile?.userId ?? null,
    archivedBusinessProfiles: sourceProfiles.slice(1),
    archivedOrphanInvoiceActivities: orphanInvoiceActivities,
    tables: {
      businessProfiles: primaryProfile ? [mapOwner(primaryProfile)] : [],
      clients: source.tables.clients.map(mapOwner),
      catalogItems: source.tables.catalogItems.map(mapOwner),
      invoices: source.tables.invoices.map(mapOwner),
      invoiceItems: source.tables.invoiceItems,
      invoiceActivities: validActivities.map(mapOwner),
    },
  };
  const directory = "/home/ubuntu/faktur-migration-backups";
  await mkdir(directory, { recursive: true });
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const path = resolve(directory, `supabase-transform-${timestamp}.json`);
  await writeFile(path, JSON.stringify(transformed, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ path, targetUserId, primaryBusinessProfileSourceUserId: transformed.primaryBusinessProfileSourceUserId, archivedBusinessProfiles: transformed.archivedBusinessProfiles.length, archivedOrphanInvoiceActivities: transformed.archivedOrphanInvoiceActivities.length, counts: Object.fromEntries(Object.entries(transformed.tables).map(([table, rows]) => [table, rows.length])) }));
} finally {
  await client.end();
}
