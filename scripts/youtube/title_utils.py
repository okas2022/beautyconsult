"""YouTube title helpers — prefer Korean display titles."""

from __future__ import annotations

import re
import subprocess
import sys

HANGUL_RE = re.compile(r"[\uac00-\ud7a3]")


def hangul_count(text: str) -> int:
    return len(HANGUL_RE.findall(text or ""))


def is_korean_title(title: str, min_hangul: int = 4) -> bool:
    return hangul_count(title) >= min_hangul


def fetch_title_ko(video_id: str) -> str:
    url = f"https://youtu.be/{video_id}"
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "yt_dlp",
            "--print",
            "%(title)s",
            "--skip-download",
            "--extractor-args",
            "youtube:lang=ko",
            url,
        ],
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "yt-dlp failed")
    title = result.stdout.strip()
    if not title:
        raise RuntimeError("empty title")
    return title


def pick_display_title(video_id: str, *candidates: str | None) -> str:
    """Prefer Korean title; fall back to yt-dlp ko fetch."""
    for candidate in candidates:
        if candidate and is_korean_title(candidate):
            return candidate.strip()
    try:
        return fetch_title_ko(video_id)
    except Exception:
        for candidate in candidates:
            if candidate and candidate.strip():
                return candidate.strip()
        return "위드성형외과 상담 영상"
