/**
 * 특정 YouTube URL 목록 → 병원 videos_knowledge.json 병합
 * Usage:
 *   node scripts/youtube/ingest-video-urls.mjs \
 *     --out data/hospitals/id-hospital/videos_knowledge.json \
 *     --name "아이디병원" \
 *     --urls "https://youtu.be/5kSfFkF9vrM,https://youtu.be/1AVArLFCR4I"
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { YoutubeTranscript } from "youtube-transcript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    out: "data/hospitals/id-hospital/videos_knowledge.json",
    name: "병원",
    urls: [],
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--out") opts.out = args[++i];
    else if (args[i] === "--name") opts.name = args[++i];
    else if (args[i] === "--urls") {
      opts.urls = args[++i].split(",").map((u) => u.trim()).filter(Boolean);
    }
  }
  return opts;
}

function parseVideoId(url) {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fetchTitle(videoId) {
  try {
    const out = execFileSync(
      "python3",
      ["-m", "yt_dlp", "--skip-download", "--print", "%(title)s", `https://youtu.be/${videoId}`],
      { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024 },
    );
    return out.trim() || videoId;
  } catch {
    return videoId;
  }
}

async function fetchTranscripts(videoId, title, hospitalName) {
  for (const lang of ["ko", "en"]) {
    try {
      const items = await YoutubeTranscript.fetchTranscript(videoId, { lang });
      if (items?.length) {
        return items.map((item) => ({
          seconds: Math.floor(item.offset / 1000),
          timestamp: formatTimestamp(Math.floor(item.offset / 1000)),
          speaker: "원장",
          text: item.text.trim(),
        }));
      }
    } catch {
      /* next lang */
    }
  }
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (items?.length) {
      return items.map((item) => ({
        seconds: Math.floor(item.offset / 1000),
        timestamp: formatTimestamp(Math.floor(item.offset / 1000)),
        speaker: "원장",
        text: item.text.trim(),
      }));
    }
  } catch {
    /* fallback */
  }
  return [
    {
      seconds: 0,
      timestamp: "00:00",
      speaker: "원장",
      text: `[자동 요약] ${title} — ${hospitalName} 등록 영상입니다.`,
    },
  ];
}

function chunkScripts(scripts, chunkSize = 5) {
  const chunks = [];
  for (let i = 0; i < scripts.length; i += chunkSize) {
    chunks.push(scripts.slice(i, i + chunkSize));
  }
  return chunks;
}

function groupKnowledgeByVideo(entries) {
  const byVideo = new Map();
  for (const entry of entries) {
    if (!entry?.video_id) continue;
    let bucket = byVideo.get(entry.video_id);
    if (!bucket) {
      bucket = { video_id: entry.video_id, title: entry.title, url: entry.url, scripts: [] };
      byVideo.set(entry.video_id, bucket);
    }
    if (entry.title) bucket.title = entry.title;
    if (entry.url) bucket.url = entry.url;
    for (const s of entry.scripts ?? []) {
      bucket.scripts.push(s);
    }
  }
  for (const bucket of byVideo.values()) {
    bucket.scripts.sort((a, b) => (a.seconds ?? 0) - (b.seconds ?? 0));
    const seen = new Set();
    bucket.scripts = bucket.scripts.filter((s) => {
      const key = `${s.seconds}:${s.text?.slice(0, 60)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  return byVideo;
}

function flattenKnowledge(byVideo) {
  const knowledge = [];
  for (const bucket of byVideo.values()) {
    const groups = bucket.scripts.length > 8 ? chunkScripts(bucket.scripts, 5) : [bucket.scripts];
    for (const group of groups) {
      knowledge.push({
        video_id: bucket.video_id,
        title: bucket.title,
        url: bucket.url ?? `https://youtu.be/${bucket.video_id}`,
        scripts: group,
      });
    }
  }
  return knowledge;
}

async function main() {
  const opts = parseArgs();
  if (!opts.urls.length) {
    console.error("Provide --urls with comma-separated YouTube links");
    process.exit(1);
  }

  const outPath = path.join(ROOT, opts.out);
  let existing = [];
  if (fs.existsSync(outPath)) {
    existing = JSON.parse(fs.readFileSync(outPath, "utf-8"));
  }

  const byVideo = groupKnowledgeByVideo(existing);

  for (const url of opts.urls) {
    const videoId = parseVideoId(url);
    if (!videoId) {
      console.warn(`⚠ skip invalid URL: ${url}`);
      continue;
    }
    process.stdout.write(`  · ${videoId} `);
    const title = fetchTitle(videoId);
    const scripts = await fetchTranscripts(videoId, title, opts.name);
    const existingBucket = byVideo.get(videoId);
    const existingReal = existingBucket?.scripts?.filter(
      (s) => !String(s.text ?? "").startsWith("[자동"),
    ).length ?? 0;
    const newReal = scripts.filter((s) => !String(s.text ?? "").startsWith("[자동")).length;

    if (existingReal > 0 && newReal <= existingReal) {
      console.log(`↷ keep existing (${existingReal} real segments) — ${title.slice(0, 50)}`);
      continue;
    }

    byVideo.set(videoId, {
      video_id: videoId,
      title,
      url: `https://youtu.be/${videoId}`,
      scripts,
    });
    console.log(`✓ ${scripts.length} segments (${newReal} real) — ${title.slice(0, 50)}`);
    await new Promise((r) => setTimeout(r, 500));
  }

  const knowledge = flattenKnowledge(byVideo);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(knowledge, null, 2), "utf-8");
  console.log(`🎉 Saved ${byVideo.size} videos (${knowledge.length} entries) → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
