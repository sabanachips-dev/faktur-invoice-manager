import { readFile } from "node:fs/promises";
import { Client } from "pg";

const transformPath = process.argv[2];
if (!transformPath) throw new Error("Usage: node scripts/import-transformed-data-to-supabase.mjs <transform-path>");
const connectionString = process.env.SUPABASE_DIRECT_DATABASE_URL;
if (!connectionString) throw new Error("SUPABASE_DIRECT_DATABASE_URL is required.");
const transformed = JSON.parse(await readFile(transformPath, "utf8"));
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

const tableCounts = ["businessProfiles", "clients", "catalogItems", "invoices", "invoiceItems", "invoiceActivities"];
const quotedTable = table => `public."${table}"`;

await client.connect();
try {
  await client.query("begin");
  for (const table of tableCounts) {
    const { rows } = await client.query(`select count(*)::int as total from ${quotedTable(table)}`);
    if (rows[0].total !== 0) throw new Error(`Target table ${table} is not empty; import stopped.`);
  }

  const profile = transformed.tables.businessProfiles[0];
  if (profile) {
    await client.query(`insert into public."businessProfiles" ("userId", "businessName", address, email, phone, "bankName", "bankAccountName", "bankAccountNumber", "logoUrl", "accentColor", "invoiceTemplate", "invoiceNumberFormat", "defaultTaxRate", "defaultCurrency", "createdAt", "updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [profile.userId, profile.businessName, profile.address, profile.email, profile.phone, profile.bankName, profile.bankAccountName, profile.bankAccountNumber, profile.logoUrl, profile.accentColor, profile.invoiceTemplate, profile.invoiceNumberFormat, profile.defaultTaxRate, profile.defaultCurrency, profile.createdAt, profile.updatedAt]);
  }
  for (const row of transformed.tables.clients) await client.query(`insert into public.clients (id, "userId", name, email, phone, address, "taxId", "createdAt", "updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`, [row.id, row.userId, row.name, row.email, row.phone, row.address, row.taxId, row.createdAt, row.updatedAt]);
  for (const row of transformed.tables.catalogItems) await client.query(`insert into public."catalogItems" (id, "userId", name, description, "defaultPrice", "createdAt", "updatedAt") values ($1,$2,$3,$4,$5,$6,$7)`, [row.id, row.userId, row.name, row.description, row.defaultPrice, row.createdAt, row.updatedAt]);
  for (const row of transformed.tables.invoices) await client.query(`insert into public.invoices (id, "userId", "clientId", "invoiceNumber", "invoiceDate", "dueDate", status, currency, subtotal, discount, "discountType", "discountValue", "taxRate", "taxAmount", total, notes, "storeNumber", "shippingAddress", "publicId", "bulkBatchId", "isBatchSummary", "sentAt", "paidAt", "createdAt", "updatedAt") values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)`, [row.id, row.userId, row.clientId, row.invoiceNumber, row.invoiceDate, row.dueDate, row.status, row.currency, row.subtotal, row.discount, row.discountType, row.discountValue, row.taxRate, row.taxAmount, row.total, row.notes, row.storeNumber, row.shippingAddress, row.publicId, row.bulkBatchId, row.isBatchSummary, row.sentAt, row.paidAt, row.createdAt, row.updatedAt]);
  for (const row of transformed.tables.invoiceItems) await client.query(`insert into public."invoiceItems" (id, "invoiceId", "catalogItemId", description, quantity, "unitPrice", subtotal, position) values ($1,$2,$3,$4,$5,$6,$7,$8)`, [row.id, row.invoiceId, row.catalogItemId, row.description, row.quantity, row.unitPrice, row.subtotal, row.position]);
  for (const row of transformed.tables.invoiceActivities) await client.query(`insert into public."invoiceActivities" (id, "userId", "invoiceId", action, description, "createdAt") values ($1,$2,$3,$4,$5,$6)`, [row.id, row.userId, row.invoiceId, row.action, row.description, row.createdAt]);

  for (const table of ["clients", "catalogItems", "invoices", "invoiceItems", "invoiceActivities"]) await client.query(`select setval(pg_get_serial_sequence('${quotedTable(table)}', 'id'), coalesce((select max(id) from ${quotedTable(table)}), 1), true)`);
  await client.query("commit");
  console.log(JSON.stringify({ imported: Object.fromEntries(Object.entries(transformed.tables).map(([table, rows]) => [table, rows.length])), targetUserId: transformed.targetUserId, archivedBusinessProfiles: transformed.archivedBusinessProfiles.length }));
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
