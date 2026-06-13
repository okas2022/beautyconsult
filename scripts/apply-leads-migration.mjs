/**
 * Supabase에 leads 스키마 적용
 * Usage: node scripts/apply-leads-migration.mjs
 * Requires: SUPABASE_DB_PASSWORD or SUPABASE_DB_URL in env
 */
import fs from "fs";
import path from "path";
import pg from "pg";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = process.env.SUPABASE_PROJECT_REF || "pqqhqkqovxvusxktcuce";
  if (!password) return null;
  const host = process.env.SUPABASE_DB_HOST || `db.${ref}.supabase.co`;
  return `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
}

async function main() {
  const dbUrl = getDbUrl();
  if (!dbUrl) {
    console.error("Set SUPABASE_DB_PASSWORD or SUPABASE_DB_URL");
    console.error("Or run supabase/migrations/20250613000000_leads.sql in Supabase SQL Editor");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "../supabase/migrations/20250613000000_leads.sql");
  const sql = fs.readFileSync(sqlPath, "utf-8");

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  await client.query(sql);
  await client.end();
  console.log("✓ leads migration applied");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
