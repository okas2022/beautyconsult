#!/usr/bin/env python3
"""병원별 videos_knowledge.json → videos_chunks.json (RAG 검색용)"""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HOSPITALS_DIR = ROOT / "data" / "hospitals"

VIDEO_MAX_CHARS = 420
VIDEO_MAX_SEGMENTS = 4


def chunk_video(video: dict, hospital_slug: str) -> list[dict]:
    chunks: list[dict] = []
    buffer: list[dict] = []
    char_count = 0
    base_url = video.get("url") or f"https://youtu.be/{video['video_id']}"

    def flush() -> None:
        nonlocal buffer, char_count
        if not buffer:
            return
        text = " ".join(s["text"] for s in buffer).strip()
        if not text:
            buffer = []
            char_count = 0
            return
        start = buffer[0]
        end = buffer[-1]
        t = start["seconds"]
        deep = f"{base_url}?t={t}" if "?" not in base_url else base_url
        chunks.append(
            {
                "video_id": video["video_id"],
                "url": base_url,
                "title": video.get("title") or "",
                "content_type": "video",
                "start_seconds": start["seconds"],
                "end_seconds": end["seconds"] + 3,
                "timestamp": start["timestamp"],
                "speaker": start.get("speaker", "원장"),
                "text": text,
                "deep_link": deep,
                "hospital_slug": hospital_slug,
            }
        )
        buffer = []
        char_count = 0

    for seg in video.get("scripts", []):
        seg_text = seg.get("text", "").strip()
        if not seg_text or seg_text.startswith("[자동 요약]") or seg_text.startswith("[자동 생성"):
            continue
        buffer.append(seg)
        char_count += len(seg_text)
        if char_count >= VIDEO_MAX_CHARS or len(buffer) >= VIDEO_MAX_SEGMENTS:
            flush()
    flush()
    return chunks


def group_by_video(entries: list[dict]) -> dict[str, dict]:
    by_video: dict[str, dict] = {}
    for entry in entries:
        vid = entry.get("video_id")
        if not vid:
            continue
        bucket = by_video.setdefault(
            vid,
            {
                "video_id": vid,
                "title": entry.get("title") or vid,
                "url": entry.get("url") or f"https://youtu.be/{vid}",
                "scripts": [],
            },
        )
        if entry.get("title"):
            bucket["title"] = entry["title"]
        if entry.get("url"):
            bucket["url"] = entry["url"]
        for script in entry.get("scripts") or []:
            bucket["scripts"].append(script)
    for bucket in by_video.values():
        bucket["scripts"].sort(key=lambda s: s.get("seconds", 0))
    return by_video


def chunk_title_fallback(video: dict, hospital_slug: str) -> dict:
    video_id = video["video_id"]
    title = (video.get("title") or video_id).strip()
    base_url = video.get("url") or f"https://youtu.be/{video_id}"
    # 자막 미제공 영상 — 제목 키워드로 RAG lexical 검색 품질 확보
    text = (
        f"아이디병원(ID Hospital) 전문의 상담·시술 안내 영상입니다. "
        f"영상 주제: {title}. "
        f"눈·코·가슴·리프팅·피부·윤곽·지방흡입·보톡스·필러 등 성형·피부 시술 정보를 다룹니다."
    )
    return {
        "video_id": video_id,
        "url": base_url,
        "title": title,
        "content_type": "video",
        "start_seconds": 0,
        "end_seconds": 0,
        "timestamp": "00:00",
        "speaker": "원장",
        "text": text,
        "deep_link": base_url,
        "hospital_slug": hospital_slug,
        "source": "title_only",
    }


def build_for_hospital(slug: str) -> int:
    knowledge_path = HOSPITALS_DIR / slug / "videos_knowledge.json"
    if not knowledge_path.exists():
        print(f"⏭  {slug}: no knowledge file")
        return 0

    entries = json.loads(knowledge_path.read_text(encoding="utf-8"))
    by_video = group_by_video(entries)
    all_chunks: list[dict] = []
    for video in by_video.values():
        video_chunks = chunk_video(video, slug)
        if video_chunks:
            all_chunks.extend(video_chunks)
        else:
            all_chunks.append(chunk_title_fallback(video, slug))

    for i, chunk in enumerate(all_chunks):
        chunk["id"] = f"{slug}-{chunk['video_id']}-{chunk['start_seconds']}-{i}"

    out_path = HOSPITALS_DIR / slug / "videos_chunks.json"
    out_path.write_text(json.dumps(all_chunks, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✅ {slug}: {len(all_chunks)} chunks ({len(by_video)} videos) → {out_path}")
    return len(all_chunks)


def main() -> None:
    slug_filter = None
    args = sys.argv[1:]
    if "--slug" in args:
        slug_filter = args[args.index("--slug") + 1]

    if slug_filter:
        slugs = [slug_filter]
    else:
        slugs = sorted(
            p.name
            for p in HOSPITALS_DIR.iterdir()
            if p.is_dir() and (p / "videos_knowledge.json").exists()
        )

    total = 0
    for slug in slugs:
        total += build_for_hospital(slug)
    print(f"\n🎉 Total {total} hospital chunks built")


if __name__ == "__main__":
    main()
