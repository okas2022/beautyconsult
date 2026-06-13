/**
 * 채널 URL → videos_knowledge.json 생성 (자막 fetch)
 * Usage: node scripts/youtube/build-hospital-knowledge.mjs \
 *   --channel "https://www.youtube.com/@IDhospital/videos" \
 *   --out data/hospitals/id-hospital/videos_knowledge.json \
 *   --max 12
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
    channel: "https://www.youtube.com/@IDhospital/videos",
    out: "data/hospitals/id-hospital/videos_knowledge.json",
    max: 12,
  };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--channel") opts.channel = args[++i];
    else if (args[i] === "--out") opts.out = args[++i];
    else if (args[i] === "--max") opts.max = Number(args[++i]);
  }
  return opts;
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function fetchVideoList(channelUrl, max) {
  const out = execFileSync(
    "python3",
    [
      "-m",
      "yt_dlp",
      "--flat-playlist",
      `--playlist-end=${max}`,
      "--print",
      "%(id)s\t%(title)s",
      channelUrl,
    ],
    { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024 },
  );
  const items = [];
  for (const line of out.split("\n")) {
    if (!line.includes("\t")) continue;
    const [video_id, title] = line.split("\t");
    if (!video_id?.trim()) continue;
    items.push({
      video_id: video_id.trim(),
      title: title?.trim() || video_id,
      url: `https://youtu.be/${video_id.trim()}`,
    });
  }
  return items;
}

async function fetchTranscripts(videoId, title) {
  const langs = ["ko", "en"];
  for (const lang of langs) {
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
      /* try next lang */
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
      text: `[자동 요약] ${title} — 아이디병원 등록 영상입니다.`,
    },
  ];
}

function chunkScripts(scripts, chunkSize = 4) {
  const chunks = [];
  for (let i = 0; i < scripts.length; i += chunkSize) {
    chunks.push(scripts.slice(i, i + chunkSize));
  }
  return chunks;
}

async function main() {
  const opts = parseArgs();
  const outPath = path.join(ROOT, opts.out);
  console.log(`📺 ${opts.channel} (max ${opts.max})`);

  const videos = fetchVideoList(opts.channel, opts.max);
  console.log(`✅ ${videos.length} videos found`);

  const knowledge = [];
  for (const video of videos) {
    process.stdout.write(`  · ${video.video_id} ${video.title.slice(0, 40)}... `);
    const scripts = await fetchTranscripts(video.video_id, video.title);
    // 긴 자막은 검색 품질을 위해 구간별로 분할 저장
    const groups = scripts.length > 8 ? chunkScripts(scripts, 5) : [scripts];
    for (const group of groups) {
      knowledge.push({
        video_id: video.video_id,
        title: video.title,
        url: video.url,
        scripts: group,
      });
    }
    console.log(`${scripts.length} segments`);
    await new Promise((r) => setTimeout(r, 400));
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(knowledge, null, 2), "utf-8");
  console.log(`🎉 Saved ${knowledge.length} entries → ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
