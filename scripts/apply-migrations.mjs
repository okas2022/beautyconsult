/**
 * Supabase migrations 일괄 적용
 * Usage: node scripts/apply-migrations.mjs
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
    console.error("Or run SQL files in supabase/migrations/ via Supabase SQL Editor");
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, "../supabase/migrations");
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Applying ${file}...`);
    await client.query(sql);
    console.log(`✓ ${file}`);
  }
  await client.end();
  console.log("All migrations applied.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
