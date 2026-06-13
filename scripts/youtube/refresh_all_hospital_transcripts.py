#!/usr/bin/env python3
"""병원별 videos_knowledge.json 자막 재수집 (API + yt-dlp fallback)."""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api._errors import IpBlocked, RequestBlocked, TranscriptsDisabled
except ImportError:
    print("Install: pip install youtube-transcript-api")
    sys.exit(1)

ROOT = Path(__file__).resolve().parents[2]
CATALOG = ROOT / "scripts" / "youtube" / "hospitals-network.json"

HOSPITALS = [
    {
        "slug": "with",
        "name": "위드성형외과",
        "knowledgePath": "videos_knowledge.json",
        "channel": "https://www.youtube.com/@With_ps/videos",
    },
    {
        "slug": "id-hospital",
        "name": "아이디병원",
        "knowledgePath": "data/hospitals/id-hospital/videos_knowledge.json",
        "channel": "https://www.youtube.com/@IDhospital/videos",
    },
    {
        "slug": "da-plastic",
        "name": "디에이성형외과",
        "knowledgePath": "data/hospitals/da-plastic/videos_knowledge.json",
        "channel": "https://www.youtube.com/@DAPRS/videos",
    },
    {
        "slug": "banobagi",
        "name": "바노바기성형외과",
        "knowledgePath": "data/hospitals/banobagi/videos_knowledge.json",
        "channel": "https://www.youtube.com/channel/UC2lzYQ5kXBK0gkVDe5StZzQ/videos",
    },
    {
        "slug": "wonjin",
        "name": "원진성형외과",
        "knowledgePath": "data/hospitals/wonjin/videos_knowledge.json",
        "channel": "https://www.youtube.com/@wonjinps/videos",
    },
    {
        "slug": "365mc",
        "name": "365mc",
        "knowledgePath": "data/hospitals/365mc/videos_knowledge.json",
        "channel": "https://www.youtube.com/channel/UCWswjI3a6IL0WP_xv5A3zpw/videos",
    },
    {
        "slug": "lifting",
        "name": "리팅성형외과",
        "knowledgePath": "data/hospitals/lifting/videos_knowledge.json",
        "channel": "https://www.youtube.com/@liftingps/videos",
    },
    {
        "slug": "md-breast",
        "name": "엠디성형외과",
        "knowledgePath": "data/hospitals/md-breast/videos_knowledge.json",
        "channel": "https://www.youtube.com/channel/UCEKTF51I3UiM19UetQqLxMQ/videos",
    },
    {
        "slug": "ryan",
        "name": "라이안성형외과",
        "knowledgePath": "data/hospitals/ryan/videos_knowledge.json",
        "channel": "https://www.youtube.com/channel/UCRnC-G0jVHTdbtNwCg9T9lA/videos",
    },
    {
        "slug": "ab",
        "name": "에이비성형외과",
        "knowledgePath": "data/hospitals/ab/videos_knowledge.json",
        "channel": "https://www.youtube.com/@ABPlasticSurgery/videos",
    },
    {
        "slug": "ts",
        "name": "티에스성형외과",
        "knowledgePath": "data/hospitals/ts/videos_knowledge.json",
        "channel": "https://www.youtube.com/channel/UCgnizu8p7lbCnfIs76O8J-A/videos",
    },
    {
        "slug": "brown",
        "name": "브라운성형외과",
        "knowledgePath": "data/hospitals/brown/videos_knowledge.json",
        "channel": "https://www.youtube.com/channel/UCoq9seQbioEZ8UhsRV_lTvA/videos",
    },
]

DELAY_SEC = 2.0
MAX_RETRIES = 3
IP_COOLDOWN_SEC = 60


def format_timestamp(total_seconds: int) -> str:
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes:02d}:{seconds:02d}"


def parse_vtt_seconds(raw: str) -> int:
    raw = raw.strip().replace(",", ".")
    parts = raw.split(":")
    if len(parts) == 3:
        h, m, s = parts
        return int(float(h) * 3600 + float(m) * 60 + float(s))
    if len(parts) == 2:
        m, s = parts
        return int(float(m) * 60 + float(s))
    return int(float(parts[0]))


def parse_vtt_file(path: Path) -> list[dict]:
    content = path.read_text(encoding="utf-8", errors="ignore")
    scripts: list[dict] = []
    seen: set[str] = set()

    for block in re.split(r"\n\s*\n", content):
        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue
        time_line = next((line for line in lines if "-->" in line), None)
        if not time_line:
            continue
        start_raw = time_line.split("-->", 1)[0].strip()
        text = " ".join(
            re.sub(r"<[^>]+>", "", line)
            for line in lines
            if "-->" not in line and not re.fullmatch(r"\d+", line)
        ).strip()
        if not text or text in seen:
            continue
        seen.add(text)
        total_seconds = parse_vtt_seconds(start_raw)
        scripts.append(
            {
                "seconds": total_seconds,
                "timestamp": format_timestamp(total_seconds),
                "speaker": "원장",
                "text": text,
            }
        )
    return scripts


def fetch_transcript_api(video_id: str) -> list[dict]:
    api = YouTubeTranscriptApi()
    for langs in (["ko", "ko-KR"], ["en"], [None]):
        try:
            if langs[0]:
                transcript = api.fetch(video_id, languages=langs)
            else:
                transcript = api.fetch(video_id)
            scripts = []
            for entry in transcript.snippets:
                total_seconds = int(entry.start)
                scripts.append(
                    {
                        "seconds": total_seconds,
                        "timestamp": format_timestamp(total_seconds),
                        "speaker": "원장",
                        "text": entry.text.replace("\n", " ").strip(),
                    }
                )
            if scripts:
                return scripts
        except Exception:
            continue
    raise RuntimeError("transcript API empty")


def fetch_transcript_ytdlp(video_id: str) -> list[dict]:
    url = f"https://youtu.be/{video_id}"
    with tempfile.TemporaryDirectory() as tmp:
        out_tpl = str(Path(tmp) / "%(id)s")
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "yt_dlp",
                "--skip-download",
                "--write-auto-sub",
                "--write-sub",
                "--sub-lang",
                "ko,en",
                "--sub-format",
                "vtt",
                "-o",
                out_tpl,
                url,
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        vtt_files = list(Path(tmp).glob(f"{video_id}*.vtt"))
        if not vtt_files:
            raise RuntimeError(result.stderr.strip() or "yt-dlp subtitle missing")
        scripts = parse_vtt_file(vtt_files[0])
        if not scripts:
            raise RuntimeError("yt-dlp subtitle empty")
        return scripts


def fetch_transcript(video_id: str) -> list[dict]:
    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fetch_transcript_api(video_id)
        except (IpBlocked, RequestBlocked) as exc:
            last_error = exc
            wait = IP_COOLDOWN_SEC * attempt
            print(f"    ⏳ IP block — wait {wait}s ({attempt}/{MAX_RETRIES})")
            time.sleep(wait)
        except TranscriptsDisabled:
            break
        except Exception as exc:
            last_error = exc
            break

    try:
        return fetch_transcript_ytdlp(video_id)
    except Exception as exc:
        if last_error:
            raise last_error from exc
        raise


def is_placeholder(text: str) -> bool:
    return text.strip().startswith("[자동 요약]")


def fetch_channel_videos(channel_url: str, max_videos: int) -> list[dict]:
    out = subprocess.run(
        [
            sys.executable,
            "-m",
            "yt_dlp",
            "--flat-playlist",
            f"--playlist-end={max_videos}",
            "--print",
            "%(id)s\t%(title)s",
            channel_url,
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    items = []
    for line in out.stdout.splitlines():
        if "\t" not in line:
            continue
        video_id, title = line.split("\t", 1)
        video_id = video_id.strip()
        if not video_id:
            continue
        items.append(
            {
                "video_id": video_id,
                "title": title.strip() or video_id,
                "url": f"https://youtu.be/{video_id}",
            }
        )
    return items


def chunk_scripts(scripts: list[dict], chunk_size: int = 5) -> list[list[dict]]:
    if len(scripts) <= 8:
        return [scripts]
    chunks = []
    for i in range(0, len(scripts), chunk_size):
        chunks.append(scripts[i : i + chunk_size])
    return chunks


def refresh_hospital(hospital: dict, max_videos: int, refetch_channel: bool) -> None:
    knowledge_path = ROOT / hospital["knowledgePath"]
    existing: list[dict] = []
    if knowledge_path.exists():
        existing = json.loads(knowledge_path.read_text(encoding="utf-8"))

    video_meta: dict[str, dict] = {}
    for entry in existing:
        if entry.get("video_id"):
            video_meta[entry["video_id"]] = {
                "video_id": entry["video_id"],
                "title": entry.get("title") or entry["video_id"],
                "url": entry.get("url") or f"https://youtu.be/{entry['video_id']}",
            }

    if refetch_channel or not video_meta:
        print(f"  📺 Fetching channel list (max {max_videos})...")
        for item in fetch_channel_videos(hospital["channel"], max_videos):
            video_meta[item["video_id"]] = item

    knowledge: list[dict] = []
    video_ids = list(video_meta.keys())[:max_videos]

    for video_id in video_ids:
        meta = video_meta[video_id]
        title = meta["title"]
        print(f"  · {video_id} {title[:50]}...", end=" ", flush=True)

        existing_scripts = []
        for entry in existing:
            if entry.get("video_id") != video_id:
                continue
            for script in entry.get("scripts") or []:
                if not is_placeholder(script.get("text", "")):
                    existing_scripts.append(script)

        scripts: list[dict]
        try:
            scripts = fetch_transcript(video_id)
            print(f"✓ {len(scripts)} segments (fresh)")
        except Exception as exc:
            if existing_scripts:
                scripts = existing_scripts
                print(f"⚠ keep existing ({len(scripts)} segments)")
            else:
                scripts = [
                    {
                        "seconds": 0,
                        "timestamp": "00:00",
                        "speaker": "원장",
                        "text": f"[자동 요약] {title} — {hospital['name']} 등록 영상입니다.",
                    }
                ]
                print(f"✗ placeholder ({exc})")

        for group in chunk_scripts(scripts):
            knowledge.append(
                {
                    "video_id": video_id,
                    "title": title,
                    "url": meta["url"],
                    "scripts": group,
                }
            )

        time.sleep(DELAY_SEC)

    knowledge_path.parent.mkdir(parents=True, exist_ok=True)
    knowledge_path.write_text(
        json.dumps(knowledge, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    real = sum(
        1
        for entry in knowledge
        for s in entry.get("scripts") or []
        if not is_placeholder(s.get("text", ""))
    )
    print(f"  🎉 Saved {len(knowledge)} entries, {real} real segments → {knowledge_path}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", help="Single hospital slug")
    parser.add_argument("--max", type=int, default=12, help="Max videos per hospital")
    parser.add_argument(
        "--refetch-channel",
        action="store_true",
        help="Refresh video list from YouTube channel",
    )
    args = parser.parse_args()

    targets = HOSPITALS
    if args.slug:
        targets = [h for h in HOSPITALS if h["slug"] == args.slug]
        if not targets:
            print("Unknown slug:", args.slug)
            sys.exit(1)

    for hospital in targets:
        print(f"\n🏥 {hospital['name']} ({hospital['slug']})")
        refresh_hospital(hospital, args.max, args.refetch_channel)

    print("\n✅ Transcript refresh complete")


if __name__ == "__main__":
    main()
