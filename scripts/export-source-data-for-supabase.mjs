import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const tables = ["users", "businessProfiles", "clients", "catalogItems", "invoices", "invoiceItems", "invoiceActivities"];
const connection = await mysql.createConnection(databaseUrl);
try {
  const data = {};
  for (const table of tables) {
    const [rows] = await connection.query(`select * from \`${table}\` order by id asc`);
    data[table] = rows;
  }
  const timestamp = new Date().toISOString().replaceAll(":", "-");
  const directory = "/home/ubuntu/faktur-migration-backups";
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, `source-export-${timestamp}.json`);
  await writeFile(path, JSON.stringify({ createdAt: new Date().toISOString(), tables: data }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ path, counts: Object.fromEntries(Object.entries(data).map(([table, rows]) => [table, rows.length])) }));
} finally {
  await connection.end();
}
