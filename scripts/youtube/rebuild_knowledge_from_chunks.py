#!/usr/bin/env python3
"""Emergency rebuild videos_knowledge.json from videos_chunks.json."""

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CHUNKS = ROOT / "data" / "youtube" / "videos_chunks.json"
CHANNEL = ROOT / "data" / "youtube" / "channel_videos.json"
OUTPUT = ROOT / "data" / "youtube" / "videos_knowledge.json"


def main() -> None:
    if not CHUNKS.exists():
        print(f"❌ {CHUNKS} 없음")
        return

    chunks = json.loads(CHUNKS.read_text(encoding="utf-8"))
    by_video: dict[str, list[dict]] = defaultdict(list)
    meta: dict[str, dict] = {}

    for chunk in chunks:
        vid = chunk["video_id"]
        meta[vid] = {
            "video_id": vid,
            "url": chunk.get("url") or f"https://youtu.be/{vid}",
            "title": chunk.get("title") or "",
        }
        by_video[vid].append(
            {
                "seconds": chunk["start_seconds"],
                "timestamp": chunk.get("timestamp") or "00:00",
                "speaker": chunk.get("speaker") or "원장님",
                "text": chunk.get("text", "").strip(),
            }
        )

    title_map: dict[str, str] = {}
    if CHANNEL.exists():
        for v in json.loads(CHANNEL.read_text(encoding="utf-8")).get("videos", []):
            if v.get("video_id") and v.get("title"):
                title_map[v["video_id"]] = v["title"]

    videos = []
    for vid, scripts in sorted(by_video.items()):
        scripts.sort(key=lambda s: s["seconds"])
        videos.append(
            {
                **meta[vid],
                "title": title_map.get(vid) or meta[vid]["title"],
                "scripts": scripts,
            }
        )

    OUTPUT.write_text(json.dumps(videos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ rebuilt {len(videos)} videos from chunks → {OUTPUT}")


if __name__ == "__main__":
    main()
