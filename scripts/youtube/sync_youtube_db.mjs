#!/usr/bin/env node
/**
 * Sync local YouTube RAG JSON → Supabase Postgres
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ENV_PATH = path.join(ROOT, ".env.local");
const KNOWLEDGE = path.join(ROOT, "data/youtube/videos_knowledge.json");
const CHUNKS = path.join(ROOT, "data/youtube/videos_chunks.json");
const EMBEDDINGS = path.join(ROOT, "data/youtube/videos_embeddings.json");
const CHANNEL = path.join(ROOT, "data/youtube/channel_videos.json");

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

const ENSURE_SQL = fs.readFileSync(
  path.join(ROOT, "supabase/migrations/20250611000000_youtube_rag.sql"),
  "utf-8"
);

function toVectorLiteral(values) {
  return `[${values.join(",")}]`;
}

async function main() {
  loadEnv();
  const dbUrl = buildDbUrl();
  if (!dbUrl) {
    console.error("SUPABASE_DB_PASSWORD 또는 SUPABASE_DB_URL이 필요합니다.");
    process.exit(1);
  }
  if (!fs.existsSync(KNOWLEDGE) || !fs.existsSync(CHUNKS)) {
    console.error("먼저 npm run youtube:sync 실행");
    process.exit(1);
  }

  const channelHandle = fs.existsSync(CHANNEL)
    ? JSON.parse(fs.readFileSync(CHANNEL, "utf-8")).channel_handle || "With_ps"
    : "With_ps";

  const videos = JSON.parse(fs.readFileSync(KNOWLEDGE, "utf-8"));
  const chunks = JSON.parse(fs.readFileSync(CHUNKS, "utf-8"));
  const embeddings = fs.existsSync(EMBEDDINGS)
    ? new Map(
        JSON.parse(fs.readFileSync(EMBEDDINGS, "utf-8")).vectors.map((v) => [
          v.id,
          v.values,
        ])
      )
    : new Map();

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(ENSURE_SQL);

  const videoIds = videos.map((v) => v.video_id);
  await client.query("BEGIN");

  try {
    if (videoIds.length) {
      await client.query(
        `DELETE FROM youtube_videos WHERE channel_handle = $1 AND video_id <> ALL($2::text[])`,
        [channelHandle, videoIds]
      );
    }

    for (const video of videos) {
      await client.query(
        `INSERT INTO youtube_videos (video_id, channel_handle, title, url, scripts, segment_count, content_type, synced_at)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, NOW())
         ON CONFLICT (video_id) DO UPDATE SET
           channel_handle = EXCLUDED.channel_handle,
           title = EXCLUDED.title,
           url = EXCLUDED.url,
           scripts = EXCLUDED.scripts,
           segment_count = EXCLUDED.segment_count,
           content_type = EXCLUDED.content_type,
           synced_at = NOW()`,
        [
          video.video_id,
          channelHandle,
          video.title || "",
          video.url,
          JSON.stringify(video.scripts || []),
          (video.scripts || []).length,
          video.content_type || "video",
        ]
      );
    }

    const chunkIds = chunks.map((c) => c.id);
    if (chunkIds.length) {
      await client.query(`DELETE FROM youtube_rag_chunks WHERE id <> ALL($1::text[])`, [chunkIds]);
    } else {
      await client.query(`DELETE FROM youtube_rag_chunks`);
    }

    let inserted = 0;
    for (const chunk of chunks) {
      const embedding = embeddings.get(chunk.id);
      if (embedding?.length) {
        await client.query(
          `INSERT INTO youtube_rag_chunks
            (id, video_id, title, url, start_seconds, end_seconds, timestamp, speaker, text, deep_link, content_type, embedding, synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::extensions.vector, NOW())
           ON CONFLICT (id) DO UPDATE SET
             video_id = EXCLUDED.video_id,
             title = EXCLUDED.title,
             url = EXCLUDED.url,
             start_seconds = EXCLUDED.start_seconds,
             end_seconds = EXCLUDED.end_seconds,
             timestamp = EXCLUDED.timestamp,
             speaker = EXCLUDED.speaker,
             text = EXCLUDED.text,
             deep_link = EXCLUDED.deep_link,
             content_type = EXCLUDED.content_type,
             embedding = EXCLUDED.embedding,
             synced_at = NOW()`,
          [
            chunk.id,
            chunk.video_id,
            chunk.title || "",
            chunk.url,
            chunk.start_seconds,
            chunk.end_seconds,
            chunk.timestamp,
            chunk.speaker || "원장님",
            chunk.text,
            chunk.deep_link,
            chunk.content_type || "video",
            toVectorLiteral(embedding),
          ]
        );
      } else {
        await client.query(
          `INSERT INTO youtube_rag_chunks
            (id, video_id, title, url, start_seconds, end_seconds, timestamp, speaker, text, deep_link, content_type, synced_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, NOW())
           ON CONFLICT (id) DO UPDATE SET
             video_id = EXCLUDED.video_id,
             title = EXCLUDED.title,
             url = EXCLUDED.url,
             start_seconds = EXCLUDED.start_seconds,
             end_seconds = EXCLUDED.end_seconds,
             timestamp = EXCLUDED.timestamp,
             speaker = EXCLUDED.speaker,
             text = EXCLUDED.text,
             deep_link = EXCLUDED.deep_link,
             content_type = EXCLUDED.content_type,
             synced_at = NOW()`,
          [
            chunk.id,
            chunk.video_id,
            chunk.title || "",
            chunk.url,
            chunk.start_seconds,
            chunk.end_seconds,
            chunk.timestamp,
            chunk.speaker || "원장님",
            chunk.text,
            chunk.deep_link,
            chunk.content_type || "video",
          ]
        );
      }
      inserted++;
      if (inserted % 100 === 0) console.log(`  chunks ${inserted}/${chunks.length}`);
    }

    await client.query("COMMIT");
    console.log(`✅ DB sync 완료: videos=${videos.length}, chunks=${chunks.length}, embeddings=${embeddings.size}`);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
