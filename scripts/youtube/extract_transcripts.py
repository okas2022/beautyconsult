#!/usr/bin/env python3
"""Extract Korean YouTube transcripts (long-form + shorts) for RAG."""

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
CHANNEL_VIDEOS = ROOT / "data" / "youtube" / "channel_videos.json"
OUTPUT = ROOT / "data" / "youtube" / "videos_knowledge.json"
FAILURES_PATH = ROOT / "data" / "youtube" / "transcript_failures.json"

DEFAULT_DELAY_SEC = 2.5
SHORT_DELAY_SEC = 3.5
IP_BLOCK_COOLDOWN_SEC = 90
MAX_RETRIES = 3


def load_catalog() -> list[dict]:
    if not CHANNEL_VIDEOS.exists():
        return []
    payload = json.loads(CHANNEL_VIDEOS.read_text(encoding="utf-8"))
    if payload.get("items"):
        return payload["items"]
    return payload.get("videos", [])


def load_existing() -> dict[str, dict]:
    if not OUTPUT.exists():
        return {}
    try:
        videos = json.loads(OUTPUT.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}
    return {v["video_id"]: v for v in videos if v.get("video_id") and v.get("scripts")}


def format_timestamp(total_seconds: int) -> str:
    minutes = total_seconds // 60
    seconds = total_seconds % 60
    return f"{minutes:02d}:{seconds:02d}"


def parse_vtt_seconds(raw: str) -> int:
    raw = raw.strip().replace(",", ".")
    parts = raw.split(":")
    if len(parts) == 3:
        hours, minutes, seconds = parts
        return int(float(hours) * 3600 + float(minutes) * 60 + float(seconds))
    if len(parts) == 2:
        minutes, seconds = parts
        return int(float(minutes) * 60 + float(seconds))
    return int(float(parts[0]))


def parse_vtt_file(path: Path) -> list[dict]:
    content = path.read_text(encoding="utf-8", errors="ignore")
    scripts: list[dict] = []
    seen_text: set[str] = set()

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
        if not text or text in seen_text:
            continue
        seen_text.add(text)
        total_seconds = parse_vtt_seconds(start_raw)
        scripts.append(
            {
                "seconds": total_seconds,
                "timestamp": format_timestamp(total_seconds),
                "speaker": "원장님",
                "text": text,
            }
        )
    return scripts


def fetch_transcript_api(video_id: str) -> list[dict]:
    api = YouTubeTranscriptApi()
    transcript = api.fetch(video_id, languages=["ko", "ko-KR"])
    scripts = []
    for entry in transcript.snippets:
        total_seconds = int(entry.start)
        scripts.append(
            {
                "seconds": total_seconds,
                "timestamp": format_timestamp(total_seconds),
                "speaker": "원장님",
                "text": entry.text.replace("\n", " ").strip(),
            }
        )
    return scripts


def fetch_transcript_ytdlp(video_id: str, content_type: str) -> list[dict]:
    if content_type == "short":
        url = f"https://www.youtube.com/shorts/{video_id}"
    else:
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
                "ko",
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


def fetch_transcript(video_id: str, content_type: str) -> list[dict]:
    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            return fetch_transcript_api(video_id)
        except (IpBlocked, RequestBlocked) as exc:
            last_error = exc
            if attempt < MAX_RETRIES:
                wait = IP_BLOCK_COOLDOWN_SEC * attempt
                print(f"   ⏳ IP 차단 — {wait}s 대기 후 재시도 ({attempt}/{MAX_RETRIES})")
                time.sleep(wait)
                continue
            break
        except TranscriptsDisabled:
            raise
        except Exception as exc:
            last_error = exc
            break

    try:
        return fetch_transcript_ytdlp(video_id, content_type)
    except Exception as exc:
        if last_error:
            raise last_error from exc
        raise


def order_video_ids(catalog_by_id: dict[str, dict], video_ids: list[str]) -> list[str]:
    shorts = [vid for vid in video_ids if catalog_by_id.get(vid, {}).get("content_type") == "short"]
    videos = [vid for vid in video_ids if catalog_by_id.get(vid, {}).get("content_type") != "short"]
    return shorts + videos


def save_knowledge(catalog_by_id: dict[str, dict], knowledge_map: dict[str, dict]) -> None:
    catalog_order = order_video_ids(catalog_by_id, list(catalog_by_id.keys()))
    ordered = [knowledge_map[vid] for vid in catalog_order if vid in knowledge_map]
    seen = {v["video_id"] for v in ordered}
    for vid, video in knowledge_map.items():
        if vid not in seen:
            ordered.append(video)
    OUTPUT.write_text(json.dumps(ordered, ensure_ascii=False, indent=2), encoding="utf-8")


def missing_transcript_ids(
    catalog_by_id: dict[str, dict],
    knowledge_map: dict[str, dict],
    *,
    only_shorts: bool = False,
    only_videos: bool = False,
) -> list[str]:
    missing: list[str] = []
    for vid, meta in catalog_by_id.items():
        ctype = meta.get("content_type", "video")
        if only_shorts and ctype != "short":
            continue
        if only_videos and ctype == "short":
            continue
        if knowledge_map.get(vid, {}).get("scripts"):
            continue
        missing.append(vid)
    return missing


def save_failures(
    failed: list[str],
    catalog_by_id: dict[str, dict],
    knowledge_map: dict[str, dict] | None = None,
    *,
    only_shorts: bool = False,
    only_videos: bool = False,
) -> None:
    if knowledge_map is not None:
        remaining = missing_transcript_ids(
            catalog_by_id,
            knowledge_map,
            only_shorts=only_shorts,
            only_videos=only_videos,
        )
        failed = list(dict.fromkeys(failed + remaining))
    payload = {
        "updated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "count": len(failed),
        "items": [
            {
                "video_id": vid,
                "content_type": catalog_by_id.get(vid, {}).get("content_type", "video"),
                "title": catalog_by_id.get(vid, {}).get("title", ""),
            }
            for vid in failed
        ],
    }
    FAILURES_PATH.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract YouTube transcripts for RAG")
    parser.add_argument("--only-shorts", action="store_true", help="쇼츠만 추출")
    parser.add_argument("--only-videos", action="store_true", help="롱폼만 추출")
    parser.add_argument("--retry-failed", action="store_true", help="실패 목록만 재시도")
    parser.add_argument("--limit", type=int, default=0, help="처리 개수 상한 (0=전체)")
    parser.add_argument("--delay", type=float, default=0, help="요청 간 대기(초), 0이면 기본값")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    catalog = load_catalog()
    if not catalog:
        print(f"❌ {CHANNEL_VIDEOS} 없음 — npm run youtube:channel 먼저 실행")
        sys.exit(1)

    catalog_by_id = {item["video_id"]: item for item in catalog if item.get("video_id")}
    video_ids = order_video_ids(catalog_by_id, list(catalog_by_id.keys()))

    if args.retry_failed and FAILURES_PATH.exists():
        failed_ids = [
            item["video_id"]
            for item in json.loads(FAILURES_PATH.read_text(encoding="utf-8")).get("items", [])
            if item.get("video_id")
        ]
        video_ids = [vid for vid in failed_ids if vid in catalog_by_id]
    elif args.only_shorts:
        video_ids = [vid for vid in video_ids if catalog_by_id.get(vid, {}).get("content_type") == "short"]
    elif args.only_videos:
        video_ids = [vid for vid in video_ids if catalog_by_id.get(vid, {}).get("content_type") != "short"]

    if args.limit > 0:
        video_ids = video_ids[: args.limit]

    existing = load_existing()
    knowledge_map = dict(existing)
    failed: list[str] = []
    fetched = 0
    skipped = 0

    shorts_n = sum(1 for vid in video_ids if catalog_by_id.get(vid, {}).get("content_type") == "short")
    print(
        f"자막 추출 시작: 대상 {len(video_ids)}개 (쇼츠 {shorts_n}개), 기존 {len(existing)}개 보유",
        flush=True,
    )

    for i, v_id in enumerate(video_ids, 1):
        meta = catalog_by_id.get(v_id, {})
        ctype = meta.get("content_type", "video")
        delay = args.delay or (SHORT_DELAY_SEC if ctype == "short" else DEFAULT_DELAY_SEC)

        if v_id in knowledge_map and knowledge_map[v_id].get("scripts"):
            knowledge_map[v_id]["content_type"] = ctype
            if meta.get("title"):
                knowledge_map[v_id]["title"] = meta["title"]
            if meta.get("url"):
                knowledge_map[v_id]["url"] = meta["url"]
            skipped += 1
            if i % 25 == 0 or i == len(video_ids):
                print(f"⏭️  [{i}/{len(video_ids)}] 스킵 누적 {skipped}", flush=True)
            continue

        try:
            scripts = fetch_transcript(v_id, ctype)
            knowledge_map[v_id] = {
                "video_id": v_id,
                "url": meta.get("url") or f"https://youtu.be/{v_id}",
                "title": meta.get("title") or knowledge_map.get(v_id, {}).get("title", ""),
                "content_type": ctype,
                "scripts": scripts,
            }
            fetched += 1
            save_knowledge(catalog_by_id, knowledge_map)
            tag = "🎬" if ctype == "short" else "📺"
            print(f"✅ {tag} [{i}/{len(video_ids)}] {v_id} ({len(scripts)} seg)", flush=True)
        except Exception as exc:
            failed.append(v_id)
            err = f"{type(exc).__name__}: {str(exc).splitlines()[0] if str(exc) else 'unknown'}"
            print(f"❌ [{i}/{len(video_ids)}] {v_id} — {err}", flush=True)
            if isinstance(exc, (IpBlocked, RequestBlocked)):
                print("   ⚠️  IP 차단 감지 — 남은 항목은 transcript_failures.json에 기록 후 중단", flush=True)
                failed.extend(vid for vid in video_ids[i:] if vid not in knowledge_map or not knowledge_map[vid].get("scripts"))
                break

        if i < len(video_ids):
            time.sleep(delay)

    if not knowledge_map:
        print("❌ 저장할 데이터 없음")
        sys.exit(1)

    save_knowledge(catalog_by_id, knowledge_map)
    if failed or args.only_videos or args.only_shorts:
        save_failures(
            list(dict.fromkeys(failed)),
            catalog_by_id,
            knowledge_map,
            only_shorts=args.only_shorts,
            only_videos=args.only_videos,
        )

    ordered = json.loads(OUTPUT.read_text(encoding="utf-8"))
    shorts_ok = sum(1 for v in ordered if v.get("content_type") == "short")
    print(
        f"\n🎉 신규 {fetched} / 스킵 {skipped} / 실패 {len(failed)} / 총 {len(ordered)}개 "
        f"(쇼츠 {shorts_ok}개) → {OUTPUT}",
        flush=True,
    )
    if failed:
        print(f"실패 목록: {FAILURES_PATH} ({len(failed)}개)", flush=True)


if __name__ == "__main__":
    main()
