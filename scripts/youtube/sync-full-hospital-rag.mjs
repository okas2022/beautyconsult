#!/usr/bin/env node
/**
 * 전체 병원 파이프라인: 자막 재수집 → JSON → hospital_videos DB
 * Usage: node scripts/youtube/sync-full-hospital-rag.mjs [--slug id-hospital] [--max 12] [--skip-refresh]
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");

function parseArgs() {
  const args = process.argv.slice(2);
  let slug = null;
  let max = 12;
  let skipRefresh = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--slug") slug = args[++i];
    else if (args[i] === "--max") max = Number(args[++i]);
    else if (args[i] === "--skip-refresh") skipRefresh = true;
  }
  return { slug, max, skipRefresh };
}

function run(label, cmd, cmdArgs) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(cmd, cmdArgs, { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) {
    console.warn(`⚠ ${label} exited with ${result.status}`);
    return false;
  }
  return true;
}

const { slug, max, skipRefresh } = parseArgs();

if (!skipRefresh) {
  const refreshArgs = [
    path.join(__dirname, "refresh_all_hospital_transcripts.py"),
    "--max",
    String(max),
  ];
  if (slug) refreshArgs.push("--slug", slug);
  run("Refresh YouTube transcripts", "python3", refreshArgs);
}

const dbArgs = [path.join(__dirname, "sync-knowledge-to-db.mjs")];
if (slug) dbArgs.push("--slug", slug);
run("Sync knowledge JSON → Supabase hospital_videos", "node", dbArgs);

console.log("\n✅ Full hospital RAG pipeline complete");
