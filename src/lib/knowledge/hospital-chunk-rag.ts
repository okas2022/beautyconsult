import fs from "fs";
import path from "path";
import {
  getHospitalCatalogEntry,
  resolveHospitalKnowledgePaths,
} from "@/features/hospitals/constants/hospitals";
import { resolveKoreanVideoTitle } from "@/lib/video-title-ko";
import type { YoutubeChunk, YoutubeVideoRef } from "@/lib/youtube-types";

let chunkCache = new Map<string, YoutubeChunk[]>();

const QUERY_EXPANSIONS: Record<string, string[]> = {
  쌍꺼풀: ["쌍수", "쌍커풀", "인아웃", "세미아웃", "매몰", "절개"],
  눈: ["눈매", "트임", "앞트임", "뒤트임", "눈재수술", "눈성형"],
  코: ["콧대", "코끝", "코성형", "매부리", "휜코", "리프팅"],
  리프팅: ["거상", "미니거상", "딥플레인", "안면거상", "처짐"],
  가슴: ["유방", "보형물", "cc", "멘토", "모티바"],
  윤곽: ["광대", "사각턱", "턱끝", "양악"],
  피부: ["보톡스", "필러", "리쥬란", "스킨부스터"],
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function expandQueryTokens(query: string): Set<string> {
  const tokens = new Set(tokenize(query));
  const compact = query.replace(/\s+/g, "");
  for (const [key, aliases] of Object.entries(QUERY_EXPANSIONS)) {
    if (compact.includes(key) || aliases.some((a) => compact.includes(a.replace(/\s+/g, "")))) {
      tokens.add(key);
      aliases.forEach((a) => tokens.add(a.toLowerCase()));
    }
  }
  return tokens;
}

function resolveHospitalSlug(hospitalId: string): string | null {
  return getHospitalCatalogEntry(hospitalId)?.slug ?? null;
}

function resolveChunksPath(hospitalId: string): string | null {
  const slug = resolveHospitalSlug(hospitalId);
  if (!slug) return null;
  const relative = `data/hospitals/${slug}/videos_chunks.json`;
  const knowledgePaths = resolveHospitalKnowledgePaths(hospitalId);
  if (!knowledgePaths.length) return null;
  return path.join(process.cwd(), relative);
}

function normalizeChunk(raw: Record<string, unknown>): YoutubeChunk {
  return {
    id: String(raw.id ?? `${raw.video_id}-${raw.start_seconds}`),
    video_id: String(raw.video_id),
    url: String(raw.url ?? `https://youtu.be/${raw.video_id}`),
    title: String(raw.title ?? ""),
    content_type: raw.content_type === "short" ? "short" : "video",
    start_seconds: Number(raw.start_seconds ?? 0),
    end_seconds: Number(raw.end_seconds ?? 0),
    timestamp: String(raw.timestamp ?? "00:00"),
    speaker: String(raw.speaker ?? "원장"),
    text: String(raw.text ?? ""),
    deep_link: String(raw.deep_link ?? raw.url ?? `https://youtu.be/${raw.video_id}`),
  };
}

export async function loadHospitalChunks(hospitalId: string): Promise<YoutubeChunk[]> {
  const cached = chunkCache.get(hospitalId);
  if (cached) return cached;

  const filePath = resolveChunksPath(hospitalId);
  if (!filePath || !fs.existsSync(filePath)) {
    chunkCache.set(hospitalId, []);
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<Record<string, unknown>>;
    const chunks = Array.isArray(parsed) ? parsed.map(normalizeChunk) : [];
    chunkCache.set(hospitalId, chunks);
    return chunks;
  } catch (error) {
    console.warn("[loadHospitalChunks] failed:", filePath, error);
    chunkCache.set(hospitalId, []);
    return [];
  }
}

export function clearHospitalChunkCache(): void {
  chunkCache = new Map();
}

function scoreChunk(chunk: YoutubeChunk, queryTokens: Set<string>, rawQuery: string): number {
  const text = `${chunk.title} ${chunk.text}`.toLowerCase();
  const compact = rawQuery.replace(/\s+/g, "").toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (text.includes(token)) score += token.length >= 3 ? 3 : 1;
  }
  if (compact.length >= 3 && text.replace(/\s+/g, "").includes(compact)) {
    score += 8;
  }
  if (chunk.text.length >= 80 && chunk.text.length <= 500) score += 1;
  return score;
}

export async function retrieveHospitalChunks(
  query: string,
  hospitalId: string,
  limit = 5,
): Promise<YoutubeChunk[]> {
  const chunks = await loadHospitalChunks(hospitalId);
  if (!chunks.length || !query.trim()) return [];

  const queryTokens = expandQueryTokens(query);
  const ranked = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, queryTokens, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: YoutubeChunk[] = [];
  for (const { chunk } of ranked) {
    const key = `${chunk.video_id}:${chunk.start_seconds}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(chunk);
    if (results.length >= limit) break;
  }

  return results.length ? results : chunks.slice(0, Math.min(limit, 3));
}

export function hospitalChunksToVideoRefs(chunks: YoutubeChunk[]): YoutubeVideoRef[] {
  const refs: YoutubeVideoRef[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    if (seen.has(chunk.video_id)) continue;
    seen.add(chunk.video_id);
    const title = resolveKoreanVideoTitle(chunk.video_id, chunk.title?.trim() || "관련 전문의 영상");
    refs.push({
      video_id: chunk.video_id,
      url: chunk.url,
      title,
      content_type: chunk.content_type,
      start_seconds: chunk.start_seconds,
      timestamp: chunk.timestamp,
      deep_link: chunk.deep_link,
      label: `▶ ${title} (${chunk.timestamp})`,
    });
    if (refs.length >= 3) break;
  }

  return refs;
}
