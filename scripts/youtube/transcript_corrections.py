#!/usr/bin/env python3
"""자동 자막 오인식 → 의학 용어 수동 보정 사전."""

from __future__ import annotations

import json
import re
from pathlib import Path

# 긴 구문 우선 (부분 치환 방지)
PHRASE_REPLACEMENTS: list[tuple[str, str]] = [
    # 가슴 보형물
    ("모티브", "모티바"),
    ("모타바", "모티바"),
    ("보용물 CC하고 수수", "보형물 CC하고 실제"),
    ("세보용을", "새 보형물을"),
    ("보용물들은", "보형물들은"),
    ("보용물들을", "보형물들을"),
    ("보용물을", "보형물을"),
    ("보용물", "보형물"),
    ("보용을", "보형물을"),
    ("재수술수를", "재수술을"),
    ("재수술수이라면", "재수술이라면"),
    ("재수술수", "재수술"),
    ("구형 구축", "구형구축"),
    ("원인이로", "원인으로"),
    ("재수술를", "재수술을"),
    ("수술를", "수술을"),
    ("총파 검사", "초음파 검사"),
    ("다저스의 촉감의", "촉감의"),
    # 눈매교정
    ("눈매 규정이에요", "눈매교정이에요"),
    ("눈매 규정을", "눈매교정을"),
    ("눈매 규정은", "눈매교정은"),
    ("눈매 규정이", "눈매교정이"),
    ("눈매 교정을", "눈매교정을"),
    ("눈매 교정은", "눈매교정은"),
    ("눈매 교정 안", "눈매교정 안"),
    ("눈매 교정을", "눈매교정을"),
    ("눈매 교정", "눈매교정"),
    ("분매 교정", "눈매교정"),
    ("교정고 할", "교정 할"),
    ("기절개 눈매", "부분절개 눈매"),
    ("가성안검", "가성 안검하수"),
    ("그런 눈정을", "그런 눈매교정을"),
    ("눈동장", "눈동자"),
    # 쌍꺼풀·트임
    ("속상꺼플", "속쌍꺼풀"),
    ("쌍커풀 인 아웃", "쌍꺼풀 인아웃"),
    ("쌍커풀", "쌍꺼풀"),
    ("쌍커플이", "쌍꺼풀이"),
    ("쌍커플", "쌍꺼풀"),
    ("쌍꺼프를", "쌍꺼풀을"),
    ("쌍꺼프", "쌍꺼풀"),
    ("쌍꺼플 수술", "쌍꺼풀 수술"),
    ("쌍꺼플", "쌍꺼풀"),
    ("소통하려", "쌍꺼풀 라인을"),
    ("우송 타 관리", "쌍꺼풀 라인 관리"),
    ("선입금", "쌍꺼풀선"),
    # 앞트임·절개
    ("멘토 관리의", "해도 관리의"),
    ("헌 타부", "한 타입"),
    ("휨 디자인", "눈 디자인"),
    ("수술을 놀", "수술 티"),
    ("굉장해 봐요", "굉장히 해봐요"),
    ("요통 12 미리", "1.2mm"),
    ("매력적인 조선", "매력적인 수술"),
    ("타란 눈", "타원 눈"),
    # 코·비염
    ("매매한 비염", "만성 비염"),
    ("추첨 않는", "추천 않는"),
    ("집체 보형물", "제거한 보형물"),
    ("고영욱의", "고정된"),
    ("고영우 레보", "고정된 레벨"),
    ("보형물 제고에", "보형물 제거에"),
    ("표지기", "표피가"),
    ("피망이", "피부가"),
    ("연체에", "연차에"),
    # 눈썹거상·하안검
    ("평 안검 수주", "하안검 수술"),
    ("눈썹 하하가", "눈썹 아래가"),
    ("추수 라고", "추천하고"),
    # 시술 일반
    ("육기적인", "육감적인"),
    ("페더 맞는거", "필러 맞는 거"),
    ("레이저 마울", "레이저 등"),
    ("장액이", "삼출액이"),
    ("추출에 영향", "회복에 영향"),
]

# 단어 경계가 필요한 치환 (안검하수 보호 등)
WORD_REPLACEMENTS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"모티브"), "모티바"),
    (re.compile(r"모타바"), "모티바"),
    # 앞 세그먼트가 끊긴 경우만 보완 (안검하수 중복 방지)
    (re.compile(r"(?<!안검)하수라고 해요"), "안검하수라고 해요"),
]


def apply_corrections(text: str) -> str:
    if not text:
        return text
    result = text
    for old, new in PHRASE_REPLACEMENTS:
        result = result.replace(old, new)
    for pattern, new in WORD_REPLACEMENTS:
        result = pattern.sub(new, result)
    return result


def apply_to_videos(videos: list[dict]) -> tuple[list[dict], int]:
    changed = 0
    for video in videos:
        for seg in video.get("scripts", []):
            original = seg.get("text", "")
            corrected = apply_corrections(original)
            if corrected != original:
                seg["text"] = corrected
                changed += 1
    return videos, changed


def main() -> None:
    root = Path(__file__).resolve().parents[2]
    knowledge_path = root / "data" / "youtube" / "videos_knowledge.json"
    videos = json.loads(knowledge_path.read_text(encoding="utf-8"))
    videos, changed = apply_to_videos(videos)
    knowledge_path.write_text(
        json.dumps(videos, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"✅ 자막 교정 {changed}건 → {knowledge_path}")


if __name__ == "__main__":
    main()
