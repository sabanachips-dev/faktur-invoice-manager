import mysql from "mysql2/promise";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const connection = await mysql.createConnection(databaseUrl);
try {
  const tables = ["users", "businessProfiles", "clients", "catalogItems", "invoices", "invoiceItems", "invoiceActivities"];
  const counts = {};
  for (const table of tables) {
    const [rows] = await connection.query(`select count(*) as total from \`${table}\``);
    counts[table] = Number(rows[0].total);
  }
  console.log(JSON.stringify({ tables: counts }, null, 2));
} finally {
  await connection.end();
}
