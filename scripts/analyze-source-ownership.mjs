import { readFile } from "node:fs/promises";

const path = process.argv[2];
if (!path) throw new Error("Usage: node scripts/analyze-source-ownership.mjs <export-path>");
const { tables } = JSON.parse(await readFile(path, "utf8"));
const countByUser = rows => Object.fromEntries(rows.reduce((result, row) => result.set(row.userId, (result.get(row.userId) || 0) + 1), new Map()));
console.log(JSON.stringify({
  businessProfiles: countByUser(tables.businessProfiles),
  clients: countByUser(tables.clients),
  catalogItems: countByUser(tables.catalogItems),
  invoices: countByUser(tables.invoices),
  invoiceActivities: countByUser(tables.invoiceActivities),
}, null, 2));
