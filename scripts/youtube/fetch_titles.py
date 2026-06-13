#!/usr/bin/env python3
"""Fetch Korean YouTube video titles via yt-dlp (lang=ko)."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from title_utils import fetch_title_ko, is_korean_title, pick_display_title

ROOT = Path(__file__).resolve().parents[2]
KNOWLEDGE = ROOT / "data" / "youtube" / "videos_knowledge.json"
CHUNKS = ROOT / "data" / "youtube" / "videos_chunks.json"
CHANNEL = ROOT / "data" / "youtube" / "channel_videos.json"
TITLES_KO = ROOT / "data" / "youtube" / "video_titles_ko.json"


def load_existing_ko() -> dict[str, str]:
    if not TITLES_KO.exists():
        return {}
    return json.loads(TITLES_KO.read_text(encoding="utf-8"))


def apply_titles_to_knowledge() -> dict[str, str]:
    if not KNOWLEDGE.exists():
        print(f"❌ {KNOWLEDGE} not found. Run extract_transcripts.py first.")
        sys.exit(1)

    videos = json.loads(KNOWLEDGE.read_text(encoding="utf-8"))
    channel_titles: dict[str, str] = {}
    if CHANNEL.exists():
        payload = json.loads(CHANNEL.read_text(encoding="utf-8"))
        for key in ("items", "videos", "shorts"):
            for v in payload.get(key, []):
                if v.get("video_id") and v.get("title"):
                    channel_titles[v["video_id"]] = v["title"]

    ko_map = load_existing_ko()
    titles: dict[str, str] = {}

    print("유튜브 한글 제목 수집 시작 (yt-dlp lang=ko)...")
    for video in videos:
        v_id = video["video_id"]
        existing = video.get("title") or ko_map.get(v_id)
        channel = channel_titles.get(v_id)

        try:
            title = pick_display_title(v_id, existing, channel)
            video["title"] = title
            titles[v_id] = title
            ko_map[v_id] = title
            flag = "🇰🇷" if is_korean_title(title) else "⚠️"
            print(f"{flag} {v_id}: {title[:60]}{'...' if len(title) > 60 else ''}")
        except Exception as e:
            print(f"❌ {v_id}: {e}")

    KNOWLEDGE.write_text(json.dumps(videos, ensure_ascii=False, indent=2), encoding="utf-8")
    TITLES_KO.write_text(json.dumps(ko_map, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n📝 titles saved → {KNOWLEDGE}")
    print(f"📝 ko map → {TITLES_KO}")
    return titles


def apply_titles_to_chunks(titles: dict[str, str]) -> None:
    if not CHUNKS.exists():
        print("⚠️ chunks file 없음 — build_chunks.py 실행 후 다시 시도하세요.")
        return

    chunks = json.loads(CHUNKS.read_text(encoding="utf-8"))
    updated = 0
    for chunk in chunks:
        title = titles.get(chunk.get("video_id", ""))
        if title:
            chunk["title"] = title
            updated += 1

    CHUNKS.write_text(json.dumps(chunks, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"📝 chunks title updated: {updated}건 → {CHUNKS}")


def main() -> None:
    titles = apply_titles_to_knowledge()
    apply_titles_to_chunks(titles)


if __name__ == "__main__":
    main()
