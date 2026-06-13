import fs from "fs";
import path from "path";
import {
  isYoutubeDbConfigured,
  loadYoutubeChunksByIds,
  loadYoutubeChunksFromDb,
  vectorSearchChunksInDb,
} from "./youtube-db";
import {
  getVectorIndexStats,
  hydrateChunksByIds,
  vectorSearchChunkIds,
} from "./youtube-vector-search";
import { resolveKoreanVideoTitle } from "./video-title-ko";
import type { YoutubeChunk, YoutubeVideoRef } from "./youtube-types";

export type { YoutubeChunk, YoutubeVideoRef };

let chunkCache: YoutubeChunk[] | null = null;
let chunkLoadPromise: Promise<YoutubeChunk[]> | null = null;
let chunkDataSource: "db" | "file" = "file";

export function clearYoutubeRagCache(): void {
  chunkCache = null;
  chunkLoadPromise = null;
}

const QUERY_EXPANSIONS: Record<string, string[]> = {
  쌍꺼풀: ["쌍수", "쌍커풀", "인아웃", "세미아웃", "아웃라인", "매몰", "절개"],
  눈: ["눈매", "트임", "앞트임", "뒤트임", "눈재수술", "눈성형"],
  모티바: ["모타바", "motiva", "보형물", "가슴확대"],
  가슴: ["유방", "보형물", "cc", "멘토", "지방이식"],
  코: ["콧대", "코끝", "코성형", "매부리", "휜코"],
  회복: ["붓기", "멍", "흉터", "일상복귀", "다운타임"],
  마취: ["수면마취", "전신마취", "국소마취"],
  재수술: ["리비전", "재코", "재눈"],
  리프팅: ["거상", "울쎄라", "실리프팅", "처짐"],
  윤곽: ["광대", "사각턱", "턱끝"],
};

function loadChunksFromFile(): YoutubeChunk[] {
  const filePath = path.join(process.cwd(), "data", "youtube", "videos_chunks.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as YoutubeChunk[];
}

async function loadChunks(): Promise<YoutubeChunk[]> {
  if (chunkCache) return chunkCache;
  if (!chunkLoadPromise) {
    chunkLoadPromise = (async () => {
      if (isYoutubeDbConfigured()) {
        const dbChunks = await loadYoutubeChunksFromDb();
        if (dbChunks.length) {
          chunkCache = dbChunks;
          chunkDataSource = "db";
          return dbChunks;
        }
      }
      const fileChunks = loadChunksFromFile();
      chunkCache = fileChunks;
      chunkDataSource = "file";
      return fileChunks;
    })();
  }
  return chunkLoadPromise;
}

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

function scoreChunk(chunk: YoutubeChunk, queryTokens: Set<string>, rawQuery: string): number {
  const text = chunk.text.toLowerCase();
  const compact = rawQuery.replace(/\s+/g, "").toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    if (text.includes(token)) score += token.length >= 3 ? 3 : 1;
  }

  if (compact.length >= 3 && text.replace(/\s+/g, "").includes(compact)) {
    score += 8;
  }

  // Prefer mid-length informative chunks
  if (chunk.text.length >= 80 && chunk.text.length <= 500) score += 1;
  return score;
}

function reciprocalRankFusion(
  rankedLists: Array<Array<{ id: string }>>,
  limit: number,
  k = 60
): string[] {
  const scores = new Map<string, number>();
  for (const list of rankedLists) {
    list.forEach((item, rank) => {
      scores.set(item.id, (scores.get(item.id) ?? 0) + 1 / (k + rank + 1));
    });
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);
}

async function retrieveYoutubeChunksLexical(query: string, limit = 10): Promise<YoutubeChunk[]> {
  const chunks = await loadChunks();
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
  return results;
}

export interface RetrieveChunksMeta {
  dataSource: "db" | "file";
  searchMethods: Array<"vector_db" | "vector_local" | "lexical">;
}

export type RetrieveChunksResult = {
  chunks: YoutubeChunk[];
  meta: RetrieveChunksMeta;
};

export async function retrieveYoutubeChunks(
  query: string,
  limit = 5,
  options?: { includeMeta?: boolean }
): Promise<YoutubeChunk[] | RetrieveChunksResult> {
  const result = await retrieveYoutubeChunksWithMeta(query, limit);
  return options?.includeMeta ? result : result.chunks;
}

async function retrieveYoutubeChunksWithMeta(
  query: string,
  limit: number
): Promise<RetrieveChunksResult> {
  const searchMethods: RetrieveChunksMeta["searchMethods"] = [];
  if (!query.trim()) {
    return { chunks: [], meta: { dataSource: chunkDataSource, searchMethods } };
  }

  const chunks = await loadChunks();
  if (!chunks.length) {
    return { chunks: [], meta: { dataSource: chunkDataSource, searchMethods } };
  }

  // 1) DB pgvector 직접 검색 (전체 로드 없이 Top-K)
  let dbVectorChunks: YoutubeChunk[] = [];
  if (isYoutubeDbConfigured()) {
    dbVectorChunks = await vectorSearchChunksInDb(query, limit * 2);
    if (dbVectorChunks.length) searchMethods.push("vector_db");
  }

  // 2) Pinecone / 로컬 임베딩 → ID hydrate (DB 우선, 없으면 메모리 캐시)
  const vectorHits = await vectorSearchChunkIds(query, limit * 2);
  let vectorChunks: YoutubeChunk[] = [];
  if (vectorHits.length) {
    searchMethods.push("vector_local");
    const ids = vectorHits.map((h) => h.id);
    const fromDb = isYoutubeDbConfigured() ? await loadYoutubeChunksByIds(ids) : [];
    vectorChunks = fromDb.length ? fromDb : hydrateChunksByIds(chunks, vectorHits);
  }

  // 3) 키워드 + 동의어 검색
  const lexical = await retrieveYoutubeChunksLexical(query, limit * 2);
  if (lexical.length) searchMethods.push("lexical");

  const candidateLists: Array<Array<{ id: string; chunk: YoutubeChunk }>> = [];
  if (dbVectorChunks.length) {
    candidateLists.push(dbVectorChunks.map((c) => ({ id: c.id, chunk: c })));
  }
  if (vectorChunks.length) {
    candidateLists.push(vectorChunks.map((c) => ({ id: c.id, chunk: c })));
  }
  if (lexical.length) {
    candidateLists.push(lexical.map((c) => ({ id: c.id, chunk: c })));
  }

  if (!candidateLists.length) {
    return { chunks: [], meta: { dataSource: chunkDataSource, searchMethods } };
  }

  const mergedIds = reciprocalRankFusion(
    candidateLists.map((list) => list.map((item) => ({ id: item.id }))),
    limit
  );

  const byId = new Map<string, YoutubeChunk>();
  for (const list of candidateLists) {
    for (const { id, chunk } of list) byId.set(id, chunk);
  }

  const seen = new Set<string>();
  const results: YoutubeChunk[] = [];
  for (const id of mergedIds) {
    const chunk = byId.get(id);
    if (!chunk) continue;
    const key = `${chunk.video_id}:${chunk.start_seconds}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(chunk);
  }

  if (results.length < limit) {
    for (const list of candidateLists) {
      for (const { chunk } of list) {
        const key = `${chunk.video_id}:${chunk.start_seconds}`;
        if (seen.has(key)) continue;
        seen.add(key);
        results.push(chunk);
        if (results.length >= limit) break;
      }
      if (results.length >= limit) break;
    }
  }

  return {
    chunks: results.slice(0, limit),
    meta: { dataSource: chunkDataSource, searchMethods },
  };
}

const RAG_CHUNK_TEXT_MAX = 320;

function truncateRagText(text: string, max = RAG_CHUNK_TEXT_MAX): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function buildRagContextBlock(chunks: YoutubeChunk[]): string {
  if (!chunks.length) return "";
  const lines = [
    "[PreFit 검증 전문의 참고 자료 — 답변 근거로만 사용, 환자에게 출처 언급 금지]",
    "[제약] 자료에 없는 내용은 지어내지 말 것. 부족한 부분은 '대면 전문의 상담 시 안내'로 연결. 영상·대본 부재 표현 금지.",
  ];
  for (const c of chunks.slice(0, 4)) {
    const title = c.title?.trim() ? ` | ${c.title.slice(0, 40)}` : "";
    lines.push(
      `[${c.timestamp} | video_id=${c.video_id}${title}] ${truncateRagText(c.text)}`
    );
  }
  return lines.join("\n");
}

function truncateTitle(title: string, max = 42): string {
  const trimmed = title.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

export function chunksToVideoRefs(chunks: YoutubeChunk[]): YoutubeVideoRef[] {
  return chunks.map((c) => {
    const title = resolveKoreanVideoTitle(c.video_id, c.title);
    const shortTitle = truncateTitle(title);
    const isShort = c.content_type === "short";
    const prefix = isShort ? "🎬 쇼츠" : "▶";
    const baseDeepLink =
      isShort && !c.deep_link.includes("/shorts/")
        ? `https://www.youtube.com/shorts/${c.video_id}`
        : c.deep_link;
    const deepLink = baseDeepLink.includes("?t=")
      ? baseDeepLink
      : `${baseDeepLink}${baseDeepLink.includes("?") ? "&" : "?"}t=${c.start_seconds}`;
    return {
      video_id: c.video_id,
      url: c.url,
      title,
      content_type: c.content_type,
      start_seconds: c.start_seconds,
      timestamp: c.timestamp,
      deep_link: deepLink,
      label: `${prefix} ${shortTitle} (${c.timestamp})`,
    };
  });
}

export async function getYoutubeKnowledgeStats(): Promise<{
  videos: number;
  chunks: number;
  dataSource: "db" | "file";
  vectorBackend: "pinecone" | "local" | "none";
  vectorCount: number;
}> {
  const chunks = await loadChunks();
  const videoIds = new Set(chunks.map((c) => c.video_id));
  const vector = getVectorIndexStats();
  return {
    videos: videoIds.size,
    chunks: chunks.length,
    dataSource: chunkDataSource,
    vectorBackend: vector.backend,
    vectorCount: vector.vectors,
  };
}
