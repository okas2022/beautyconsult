#!/usr/bin/env python3
"""Build semantic chunks with metadata for in-context RAG retrieval."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from transcript_corrections import apply_to_videos

ROOT = Path(__file__).resolve().parents[2]
INPUT = ROOT / "data" / "youtube" / "videos_knowledge.json"
CATALOG = ROOT / "data" / "youtube" / "channel_videos.json"
OUTPUT = ROOT / "data" / "youtube" / "videos_chunks.json"

VIDEO_MAX_CHARS = 420
VIDEO_MAX_SEGMENTS = 4
SHORT_MAX_CHARS = 280
SHORT_MAX_SEGMENTS = 6


def chunk_video(video: dict) -> list[dict]:
    is_short = video.get("content_type") == "short"
    max_chars = SHORT_MAX_CHARS if is_short else VIDEO_MAX_CHARS
    max_segments = SHORT_MAX_SEGMENTS if is_short else VIDEO_MAX_SEGMENTS
    content_type = "short" if is_short else "video"
    base_url = video.get("url") or f"https://youtu.be/{video['video_id']}"
    if is_short and "shorts/" not in base_url:
        base_url = f"https://www.youtube.com/shorts/{video['video_id']}"

    chunks: list[dict] = []
    buffer: list[dict] = []
    char_count = 0

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
                "content_type": content_type,
                "start_seconds": start["seconds"],
                "end_seconds": end["seconds"] + 3,
                "timestamp": start["timestamp"],
                "speaker": start.get("speaker", "원장님"),
                "text": text,
                "deep_link": deep,
            }
        )
        buffer = []
        char_count = 0

    for seg in video.get("scripts", []):
        seg_text = seg.get("text", "").strip()
        if not seg_text:
            continue
        buffer.append(seg)
        char_count += len(seg_text)
        if char_count >= max_chars or len(buffer) >= max_segments:
            flush()
    flush()
    return chunks


def chunk_title_fallback(item: dict) -> dict:
    video_id = item["video_id"]
    title = (item.get("title") or "").strip()
    is_short = item.get("content_type") == "short"
    content_type = "short" if is_short else "video"
    if is_short:
        base_url = item.get("url") or f"https://www.youtube.com/shorts/{video_id}"
        text = f"위드성형외과 쇼츠: {title}"
    else:
        base_url = item.get("url") or f"https://youtu.be/{video_id}"
        text = f"위드성형외과 상담 영상: {title}"
    return {
        "video_id": video_id,
        "url": base_url,
        "title": title,
        "content_type": content_type,
        "start_seconds": 0,
        "end_seconds": 0,
        "timestamp": "00:00",
        "speaker": "원장님",
        "text": text,
        "deep_link": base_url,
        "source": "title_only",
    }


def load_title_only_catalog_items(knowledge_ids: set[str]) -> list[dict]:
    if not CATALOG.exists():
        return []
    payload = json.loads(CATALOG.read_text(encoding="utf-8"))
    items = payload.get("items", payload.get("videos", []))
    fallbacks: list[dict] = []
    for item in items:
        video_id = item.get("video_id")
        if not video_id or video_id in knowledge_ids:
            continue
        title = (item.get("title") or "").strip()
        if title:
            fallbacks.append(item)
    return fallbacks


def main() -> None:
    videos = json.loads(INPUT.read_text(encoding="utf-8"))
    videos, corrected = apply_to_videos(videos)
    if corrected:
        INPUT.write_text(json.dumps(videos, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"📝 transcript corrections applied: {corrected} segments")

    knowledge_ids = {v["video_id"] for v in videos if v.get("video_id")}
    all_chunks: list[dict] = []
    for video in videos:
        all_chunks.extend(chunk_video(video))

    title_only_items = load_title_only_catalog_items(knowledge_ids)
    for item in title_only_items:
        all_chunks.append(chunk_title_fallback(item))
    if title_only_items:
        title_videos = sum(1 for i in title_only_items if i.get("content_type") != "short")
        title_shorts = sum(1 for i in title_only_items if i.get("content_type") == "short")
        print(
            f"📋 제목 폴백 청크: {len(title_only_items)}개 "
            f"(롱폼 {title_videos} + 쇼츠 {title_shorts}, 자막 미확보)"
        )

    for i, chunk in enumerate(all_chunks):
        chunk["id"] = f"{chunk['video_id']}-{chunk['start_seconds']}-{i}"

    OUTPUT.write_text(json.dumps(all_chunks, ensure_ascii=False, indent=2), encoding="utf-8")
    shorts = sum(1 for c in all_chunks if c.get("content_type") == "short")
    print(f"✅ {len(all_chunks)} chunks (쇼츠 {shorts}개) → {OUTPUT}")

    titles = {v["video_id"]: v.get("title", "") for v in videos if v.get("title")}
    for item in title_only_items:
        if item.get("video_id") and item.get("title"):
            titles[item["video_id"]] = item["title"]
    if titles:
        chunks = json.loads(OUTPUT.read_text(encoding="utf-8"))
        meta = {v["video_id"]: v for v in videos}
        for chunk in chunks:
            vid = chunk["video_id"]
            if vid in titles:
                chunk["title"] = titles[vid]
            if vid in meta:
                chunk["content_type"] = meta[vid].get("content_type", chunk.get("content_type", "video"))
        OUTPUT.write_text(json.dumps(chunks, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"📝 titles propagated ({len(titles)} videos)")


if __name__ == "__main__":
    main()
