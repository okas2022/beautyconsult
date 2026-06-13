#!/usr/bin/env node
/**
 * PreFit 원클릭 재배포
 * Supabase migration → git push → Vercel production
 *
 * Usage: npm run redeploy
 * Requires: .env.local with SUPABASE_DB_PASSWORD, git remote, vercel link
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

function run(label, cmd, args, opts = {}) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
    ...opts,
  });
  if (result.status !== 0) {
    console.error(`\n✗ Failed: ${label}`);
    process.exit(result.status ?? 1);
  }
}

function runOptional(label, cmd, args) {
  console.log(`\n▶ ${label} (optional)`);
  const result = spawnSync(cmd, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.warn(`⚠ Skipped or failed: ${label}`);
  }
}

async function syncVercelEnv(name, value) {
  if (!value) return;
  const check = spawnSync("npx", ["vercel", "env", "ls", "production"], {
    cwd: ROOT,
    encoding: "utf-8",
    env: process.env,
  });
  if (check.stdout?.includes(name)) {
    console.log(`  · Vercel env ${name} already set`);
    return;
  }
  console.log(`  · Adding Vercel env ${name}`);
  spawnSync("npx", ["vercel", "env", "add", name, "production", "--yes"], {
    cwd: ROOT,
    input: value,
    stdio: ["pipe", "inherit", "inherit"],
    env: process.env,
  });
}

async function main() {
  loadEnvLocal();

  console.log("🚀 PreFit redeploy pipeline\n");

  if (process.env.SUPABASE_DB_PASSWORD || process.env.SUPABASE_DB_URL) {
    const migrate = spawnSync("npm", ["run", "db:migrate"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
    });
    if (migrate.status !== 0) {
      console.warn(
        "⚠ DB migrate failed (pooler DNS/auth). If SQL was applied in Supabase dashboard, continue.",
      );
    }
  } else {
    console.warn(
      "⚠ SUPABASE_DB_PASSWORD not set — skip DB migrate (run ALL_APPLY_IN_ORDER.sql manually)",
    );
  }

  runOptional("Production build check", "npm", ["run", "build"]);

  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: ROOT,
    encoding: "utf-8",
  });
  if (status.stdout?.trim()) {
    run("Git commit", "git", ["add", "-A"]);
    run("Git commit", "git", [
      "commit",
      "-m",
      "chore: redeploy sync",
    ]);
  } else {
    console.log("\n· Git working tree clean — nothing to commit");
  }

  run("Git push origin main", "git", ["push", "origin", "main"]);

  await syncVercelEnv("REPLICATE_API_TOKEN", process.env.REPLICATE_API_TOKEN);
  await syncVercelEnv("GEMINI_API_KEY", process.env.GEMINI_API_KEY);
  await syncVercelEnv("ADMIN_SECRET_KEY", process.env.ADMIN_SECRET_KEY);

  run("Vercel production deploy", "npx", ["vercel", "deploy", "--prod", "--yes"]);

  console.log("\n✅ Redeploy complete");
  console.log("   GitHub: https://github.com/okas2022/beautyconsult");
  console.log("   Live:   https://beutyconsult.vercel.app");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
