#!/usr/bin/env node
/**
 * videos_knowledge.json → Supabase hospital_videos 일괄 upsert
 * Usage: node scripts/youtube/sync-knowledge-to-db.mjs [--slug with] [--dry-run]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { HOSPITALS_NETWORK } from "./hospitals-network.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");

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

function parseArgs() {
  const args = process.argv.slice(2);
  let slugFilter = null;
  let dryRun = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--slug") slugFilter = args[++i];
    else if (args[i] === "--dry-run") dryRun = true;
  }
  return { slugFilter, dryRun };
}

function groupKnowledgeByVideo(entries) {
  const byVideo = new Map();

  for (const entry of entries) {
    if (!entry?.video_id || !Array.isArray(entry.scripts)) continue;

    let bucket = byVideo.get(entry.video_id);
    if (!bucket) {
      bucket = {
        video_id: entry.video_id,
        title: entry.title ?? entry.video_id,
        url: entry.url ?? `https://youtu.be/${entry.video_id}`,
        transcripts: [],
        seen: new Set(),
      };
      byVideo.set(entry.video_id, bucket);
    }

    if (entry.title) bucket.title = entry.title;
    if (entry.url) bucket.url = entry.url;

    for (const script of entry.scripts) {
      const key = `${script.seconds ?? 0}:${(script.text ?? "").slice(0, 80)}`;
      if (bucket.seen.has(key)) continue;
      bucket.seen.add(key);
      bucket.transcripts.push({
        seconds: script.seconds ?? 0,
        timestamp: script.timestamp ?? "00:00",
        speaker: script.speaker ?? "원장",
        text: script.text ?? "",
      });
    }
  }

  for (const bucket of byVideo.values()) {
    bucket.transcripts.sort((a, b) => a.seconds - b.seconds);
    delete bucket.seen;
  }

  return Array.from(byVideo.values());
}

function countRealTranscripts(transcripts) {
  return transcripts.filter((t) => !/^\[자동 요약\]/.test(t.text ?? "")).length;
}

async function main() {
  loadEnvLocal();
  const { slugFilter, dryRun } = parseArgs();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const targets = slugFilter
    ? HOSPITALS_NETWORK.filter((h) => h.slug === slugFilter)
    : HOSPITALS_NETWORK;

  if (!targets.length) {
    console.error("No hospital matched slug:", slugFilter);
    process.exit(1);
  }

  let totalVideos = 0;
  let totalSegments = 0;

  for (const hospital of targets) {
    const filePath = path.join(ROOT, hospital.knowledgePath);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠ Skip ${hospital.slug}: missing ${hospital.knowledgePath}`);
      continue;
    }

    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const grouped = groupKnowledgeByVideo(raw);
    const realCount = grouped.reduce(
      (n, v) => n + countRealTranscripts(v.transcripts),
      0,
    );

    console.log(
      `\n🏥 ${hospital.name} (${hospital.slug}) — ${grouped.length} videos, ${realCount} real segments`,
    );

    if (dryRun) continue;

    for (const video of grouped) {
      const { error } = await supabase.from("hospital_videos").upsert(
        {
          hospital_id: hospital.id,
          video_id: video.video_id,
          title: video.title,
          url: video.url,
          transcripts: video.transcripts,
        },
        { onConflict: "hospital_id,video_id" },
      );

      if (error) {
        console.error(`  ✗ ${video.video_id}:`, error.message);
        continue;
      }

      totalVideos += 1;
      totalSegments += video.transcripts.length;
      const real = countRealTranscripts(video.transcripts);
      console.log(
        `  ✓ ${video.video_id} — ${video.transcripts.length} segments (${real} real)`,
      );
    }

    await supabase
      .from("hospitals")
      .update({ is_subscribed: true })
      .eq("id", hospital.id);
  }

  console.log(
    `\n✅ Sync complete — ${totalVideos} videos, ${totalSegments} transcript segments in hospital_videos`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
