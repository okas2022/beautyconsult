#!/usr/bin/env python3
"""Fetch @With_ps long-form videos + shorts via yt-dlp."""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG_PATH = ROOT / "data" / "youtube" / "channel_config.json"
OUTPUT_PATH = ROOT / "data" / "youtube" / "channel_videos.json"

DEFAULT_CONFIG = {
    "channel_url": "https://www.youtube.com/@With_ps/videos",
    "shorts_url": "https://www.youtube.com/@With_ps/shorts",
    "channel_handle": "With_ps",
    "max_videos": 500,
    "video_playlist_start": 1,
    "max_shorts": 200,
}


def load_config() -> dict:
    if CONFIG_PATH.exists():
        return {**DEFAULT_CONFIG, **json.loads(CONFIG_PATH.read_text(encoding="utf-8"))}
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps(DEFAULT_CONFIG, ensure_ascii=False, indent=2), encoding="utf-8")
    return DEFAULT_CONFIG.copy()


def fetch_playlist(
    channel_url: str,
    max_items: int,
    content_type: str,
    playlist_start: int = 1,
) -> list[dict]:
    cmd = [
        sys.executable,
        "-m",
        "yt_dlp",
        "--flat-playlist",
        f"--playlist-end={max_items}",
        "--extractor-args",
        "youtube:lang=ko",
        "--print",
        "%(id)s\t%(title)s",
        channel_url,
    ]
    if playlist_start > 1:
        cmd.insert(-1, f"--playlist-start={playlist_start}")

    result = subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or f"yt-dlp failed: {channel_url}")

    items: list[dict] = []
    seen: set[str] = set()
    for line in result.stdout.splitlines():
        line = line.strip()
        if not line or "\t" not in line:
            continue
        video_id, title = line.split("\t", 1)
        video_id = video_id.strip()
        if not video_id or video_id in seen:
            continue
        seen.add(video_id)
        url = (
            f"https://www.youtube.com/shorts/{video_id}"
            if content_type == "short"
            else f"https://youtu.be/{video_id}"
        )
        items.append(
            {
                "video_id": video_id,
                "title": title.strip(),
                "url": url,
                "content_type": content_type,
            }
        )
    return items


def load_existing_catalog() -> dict[str, dict]:
    if not OUTPUT_PATH.exists():
        return {}
    try:
        payload = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    by_id: dict[str, dict] = {}
    for key in ("items", "videos", "shorts"):
        for item in payload.get(key, []):
            if item.get("video_id"):
                by_id[item["video_id"]] = item
    return by_id


def merge_catalog(videos: list[dict], shorts: list[dict], existing: dict[str, dict] | None = None) -> list[dict]:
    by_id: dict[str, dict] = dict(existing or {})
    for item in videos + shorts:
        by_id[item["video_id"]] = {**by_id.get(item["video_id"], {}), **item}
    return list(by_id.values())


def main() -> None:
    config = load_config()
    max_videos = int(config.get("max_videos", 500))
    video_start = int(config.get("video_playlist_start", 1))
    max_shorts = int(config.get("max_shorts", 200))
    existing = load_existing_catalog()

    range_label = f"{video_start}~" if video_start > 1 else "1~"
    print(f"📺 롱폼 수집: {config['channel_url']} ({range_label}{max_videos}개)")
    videos = fetch_playlist(config["channel_url"], max_videos, "video", video_start)
    print(f"✅ 롱폼 {len(videos)}개 (기존 카탈로그 {len(existing)}개 병합)")

    shorts_url = config.get("shorts_url", "https://www.youtube.com/@With_ps/shorts")
    print(f"🎬 쇼츠 수집: {shorts_url} (최대 {max_shorts}개)")
    shorts = fetch_playlist(shorts_url, max_shorts, "short")
    print(f"✅ 쇼츠 {len(shorts)}개")

    items = merge_catalog(videos, shorts, existing)
    merged_videos = [i for i in items if i.get("content_type") != "short"]
    merged_shorts = [i for i in items if i.get("content_type") == "short"]
    payload = {
        **config,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "counts": {
            "videos": len(merged_videos),
            "shorts": len(merged_shorts),
            "total_unique": len(items),
            "fetched_this_run": {"videos": len(videos), "shorts": len(shorts)},
        },
        "videos": merged_videos,
        "shorts": merged_shorts,
        "items": items,
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"🎉 총 {len(items)}개 (롱폼 {len(videos)} + 쇼츠 {len(shorts)}) → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
