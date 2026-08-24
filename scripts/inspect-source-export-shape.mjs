import { readFile } from "node:fs/promises";

const path = process.argv[2];
if (!path) throw new Error("Usage: node scripts/inspect-source-export-shape.mjs <export-path>");
const exportData = JSON.parse(await readFile(path, "utf8"));
const shape = Object.fromEntries(Object.entries(exportData.tables).map(([table, rows]) => [table, { count: rows.length, columns: rows[0] ? Object.keys(rows[0]).sort() : [] }]));
console.log(JSON.stringify(shape, null, 2));
