/**
 * 병원 네트워크 YouTube knowledge 일괄 동기화
 * Usage: node scripts/youtube/sync-hospital-network.mjs [--max 8] [--slug banobagi]
 */
import { execFileSync, spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");

const HOSPITALS = [
  { slug: "banobagi", name: "바노바기성형외과", channels: ["https://www.youtube.com/channel/UC2lzYQ5kXBK0gkVDe5StZzQ/videos"] },
  { slug: "wonjin", name: "원진성형외과", channels: ["https://www.youtube.com/@wonjinps/videos"] },
  { slug: "365mc", name: "365mc", channels: ["https://www.youtube.com/channel/UCWswjI3a6IL0WP_xv5A3zpw/videos"] },
  { slug: "lifting", name: "리팅성형외과", channels: ["https://www.youtube.com/@liftingps/videos"] },
  { slug: "md-breast", name: "엠디성형외과", channels: ["https://www.youtube.com/channel/UCEKTF51I3UiM19UetQqLxMQ/videos"] },
  { slug: "ryan", name: "라이안성형외과", channels: ["https://www.youtube.com/channel/UCRnC-G0jVHTdbtNwCg9T9lA/videos"] },
  { slug: "ab", name: "에이비성형외과", channels: ["https://www.youtube.com/@ABPlasticSurgery/videos"] },
  { slug: "ts", name: "티에스성형외과", channels: ["https://www.youtube.com/channel/UCgnizu8p7lbCnfIs76O8J-A/videos"] },
  { slug: "brown", name: "브라운성형외과", channels: ["https://www.youtube.com/channel/UCoq9seQbioEZ8UhsRV_lTvA/videos"] },
];

function parseArgs() {
  const args = process.argv.slice(2);
  let max = 8;
  let slugFilter = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--max") max = Number(args[++i]);
    else if (args[i] === "--slug") slugFilter = args[++i];
  }
  return { max, slugFilter };
}

async function main() {
  const { max, slugFilter } = parseArgs();
  const targets = slugFilter
    ? HOSPITALS.filter((h) => h.slug === slugFilter)
    : HOSPITALS;

  if (!targets.length) {
    console.error("No hospitals matched slug:", slugFilter);
    process.exit(1);
  }

  const buildScript = path.join(__dirname, "build-hospital-knowledge.mjs");

  for (const hospital of targets) {
    const out = `data/hospitals/${hospital.slug}/videos_knowledge.json`;
    console.log(`\n🏥 ${hospital.name} (${hospital.slug})`);

    if (hospital.channels.length === 1) {
      const result = spawnSync(
        process.execPath,
        [
          buildScript,
          "--channel",
          hospital.channels[0],
          "--out",
          out,
          "--max",
          String(max),
          "--name",
          hospital.name,
        ],
        { stdio: "inherit", cwd: ROOT },
      );
      if (result.status !== 0) process.exit(result.status ?? 1);
      continue;
    }

    const tempFiles = [];
    for (let i = 0; i < hospital.channels.length; i++) {
      const tempOut = `data/hospitals/${hospital.slug}/.tmp-${i}.json`;
      tempFiles.push(tempOut);
      const result = spawnSync(
        process.execPath,
        [
          buildScript,
          "--channel",
          hospital.channels[i],
          "--out",
          tempOut,
          "--max",
          String(Math.ceil(max / hospital.channels.length)),
          "--name",
          hospital.name,
        ],
        { stdio: "inherit", cwd: ROOT },
      );
      if (result.status !== 0) process.exit(result.status ?? 1);
    }

    const merged = [];
    const seen = new Set();
    for (const temp of tempFiles) {
      const full = path.join(ROOT, temp);
      if (!fs.existsSync(full)) continue;
      const items = JSON.parse(fs.readFileSync(full, "utf-8"));
      for (const item of items) {
        const key = `${item.video_id}:${item.scripts?.[0]?.seconds ?? 0}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(item);
      }
      fs.unlinkSync(full);
    }

    const outPath = path.join(ROOT, out);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(merged.slice(0, max * 2), null, 2));
    console.log(`🎉 Merged ${merged.length} → ${out}`);
  }

  console.log("\n✅ Hospital network sync complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
