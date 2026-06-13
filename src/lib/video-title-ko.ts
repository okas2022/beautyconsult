import fs from "fs";
import path from "path";

const HANGUL_RE = /[\uac00-\ud7a3]/g;

let titleKoCache: Record<string, string> | null = null;

function loadTitleKoMap(): Record<string, string> {
  if (titleKoCache) return titleKoCache;
  const filePath = path.join(process.cwd(), "data", "youtube", "video_titles_ko.json");
  if (!fs.existsSync(filePath)) {
    titleKoCache = {};
    return titleKoCache;
  }
  titleKoCache = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, string>;
  return titleKoCache;
}

function hangulCount(text: string): number {
  return (text.match(HANGUL_RE) ?? []).length;
}

/** UI 표시용 — 한글 제목 우선 */
export function resolveKoreanVideoTitle(videoId: string, title?: string): string {
  const trimmed = title?.trim() ?? "";
  if (hangulCount(trimmed) >= 4) return trimmed;

  const fromMap = loadTitleKoMap()[videoId]?.trim();
  if (fromMap && hangulCount(fromMap) >= 4) return fromMap;

  return trimmed || "PreFit 검증 전문의 영상";
}
