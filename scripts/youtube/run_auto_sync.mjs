#!/usr/bin/env node
/**
 * YouTube Auto-Sync Pipeline
 * channel catalog → transcripts (incremental) → chunks → embeddings → Supabase DB
 *
 * Usage:
 *   node scripts/youtube/run_auto_sync.mjs
 *   node scripts/youtube/run_auto_sync.mjs --job-id=<uuid> --trigger=cron
 */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ENV_PATH = path.join(ROOT, ".env.local");
const CHANNEL_CONFIG = path.join(ROOT, "data/youtube/channel_config.json");
const KNOWLEDGE = path.join(ROOT, "data/youtube/videos_knowledge.json");
const CHUNKS = path.join(ROOT, "data/youtube/videos_chunks.json");
const FAILURES = path.join(ROOT, "data/youtube/transcript_failures.json");

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function buildDbUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = process.env.SUPABASE_PROJECT_REF || "ccjzmqvihndjbioceugn";
  if (!password) return null;
  const host = process.env.SUPABASE_DB_HOST || `db.${ref}.supabase.co`;
  return `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const jobId = args.find((a) => a.startsWith("--job-id="))?.split("=")[1] ?? null;
  const trigger = args.find((a) => a.startsWith("--trigger="))?.split("=")[1] ?? "manual";
  const skipDb = args.includes("--skip-db");
  return { jobId, trigger, skipDb };
}

function runCommand(cmd, args, label) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶ ${label}: ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, { cwd: ROOT, stdio: "inherit", shell: false });
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} failed (exit ${code})`));
    });
    child.on("error", reject);
  });
}

async function loadSettingsFromDb(client) {
  try {
    const res = await client.query(`SELECT * FROM youtube_channel_settings WHERE id = 'default' LIMIT 1`);
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    const config = {
      channel_url: row.channel_url,
      shorts_url: row.shorts_url,
      channel_handle: row.channel_handle,
      max_videos: row.max_videos ?? 500,
      max_shorts: row.max_shorts ?? 200,
      video_playlist_start: row.video_playlist_start ?? 1,
    };
    fs.mkdirSync(path.dirname(CHANNEL_CONFIG), { recursive: true });
    fs.writeFileSync(CHANNEL_CONFIG, JSON.stringify(config, null, 2), "utf-8");
    console.log("✅ channel_config.json ← DB settings");
    return row;
  } catch {
    return null;
  }
}

async function updateJob(client, jobId, patch) {
  if (!jobId) return;
  const fields = [];
  const values = [];
  let i = 1;
  for (const [key, value] of Object.entries(patch)) {
    fields.push(`${key} = $${i++}`);
    values.push(value);
  }
  values.push(jobId);
  await client.query(
    `UPDATE youtube_sync_jobs SET ${fields.join(", ")} WHERE id = $${i}`,
    values
  );
}

async function updateChannelSyncStatus(client, status) {
  try {
    await client.query(
      `UPDATE youtube_channel_settings SET last_synced_at = NOW(), last_sync_status = $1, updated_at = NOW() WHERE id = 'default'`,
      [status]
    );
  } catch {
    // table may not exist yet
  }
}

function countKnowledge() {
  if (!fs.existsSync(KNOWLEDGE)) return { total: 0, withScripts: 0 };
  const videos = JSON.parse(fs.readFileSync(KNOWLEDGE, "utf-8"));
  return {
    total: videos.length,
    withScripts: videos.filter((v) => v.scripts?.length).length,
  };
}

function countFailures() {
  if (!fs.existsSync(FAILURES)) return 0;
  try {
    return JSON.parse(fs.readFileSync(FAILURES, "utf-8")).count ?? 0;
  } catch {
    return 0;
  }
}

async function main() {
  loadEnv();
  const { jobId: argJobId, trigger, skipDb } = parseArgs();
  const dbUrl = buildDbUrl();
  let client = null;
  let activeJobId = argJobId;

  const logLines = [];
  const appendLog = (line) => {
    console.log(line);
    logLines.push(line);
  };

  if (dbUrl) {
    client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
    await client.connect();

    try {
      if (!activeJobId) {
        const inserted = await client.query(
          `INSERT INTO youtube_sync_jobs (trigger_source, status, stage) VALUES ($1, 'running', 'init') RETURNING id`,
          [trigger]
        );
        activeJobId = inserted.rows[0]?.id;
        if (activeJobId) appendLog(`Job created: ${activeJobId}`);
      } else {
        await updateJob(client, activeJobId, { status: "running", stage: "init", started_at: new Date() });
      }
      await loadSettingsFromDb(client);
    } catch (err) {
      appendLog(`⚠️  DB job tracking skipped: ${err instanceof Error ? err.message : err}`);
      activeJobId = null;
    }
  }
  const beforeKnowledge = countKnowledge();

  try {
    if (client && activeJobId) await updateJob(client, activeJobId, { stage: "channel", status: "running" });
    await runCommand("python3", ["scripts/youtube/fetch_channel_videos.py"], "채널 카탈로그 동기화");

    if (client && activeJobId) await updateJob(client, activeJobId, { stage: "transcripts" });
    await runCommand("python3", ["scripts/youtube/extract_transcripts.py"], "자막 추출 (신규만)");

    if (client && activeJobId) await updateJob(client, activeJobId, { stage: "chunks" });
    await runCommand("python3", ["scripts/youtube/fetch_titles.py"], "한국어 제목 보강");
    await runCommand("python3", ["scripts/youtube/build_chunks.py"], "RAG 청크 생성");

    if (client && activeJobId) await updateJob(client, activeJobId, { stage: "embeddings" });
    await runCommand("node", ["scripts/youtube/index_vectors.mjs"], "벡터 임베딩");

    if (!skipDb) {
      if (client && activeJobId) await updateJob(client, activeJobId, { stage: "db_sync" });
      await runCommand("node", ["scripts/youtube/sync_youtube_db.mjs"], "Supabase DB 동기화");
    }

    const afterKnowledge = countKnowledge();
    const chunkCount = fs.existsSync(CHUNKS)
      ? JSON.parse(fs.readFileSync(CHUNKS, "utf-8")).length
      : 0;
    const failures = countFailures();
    const videosNew = Math.max(0, afterKnowledge.withScripts - beforeKnowledge.withScripts);

    const summary = `완료: 영상 ${afterKnowledge.total}개, 자막 ${afterKnowledge.withScripts}개, 청크 ${chunkCount}개, 실패 ${failures}개`;
    appendLog(`\n🎉 ${summary}`);

    if (client && activeJobId) {
      await updateJob(client, activeJobId, {
        status: "completed",
        stage: "done",
        finished_at: new Date(),
        videos_total: afterKnowledge.total,
        videos_new: videosNew,
        chunks_total: chunkCount,
        transcript_failures: failures,
        log: logLines.join("\n").slice(-8000),
      });
      await updateChannelSyncStatus(client, "completed");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    appendLog(`\n❌ Sync failed: ${message}`);
    if (client && activeJobId) {
      await updateJob(client, activeJobId, {
        status: "failed",
        stage: "error",
        finished_at: new Date(),
        error: message.slice(0, 2000),
        log: logLines.join("\n").slice(-8000),
      });
      await updateChannelSyncStatus(client, `failed: ${message.slice(0, 200)}`);
    }
    process.exit(1);
  } finally {
    if (client) await client.end();
  }
}

main();
