import pg from "pg";
import { embedQuery } from "./gemini-embeddings";
import type { YoutubeChunk } from "./youtube-types";

let dbUrlCache: string | null | undefined;

export function buildYoutubeDbUrl(): string | null {
  if (dbUrlCache !== undefined) return dbUrlCache;
  if (process.env.SUPABASE_DB_URL) {
    dbUrlCache = process.env.SUPABASE_DB_URL;
    return dbUrlCache;
  }
  const password = process.env.SUPABASE_DB_PASSWORD;
  const ref = process.env.SUPABASE_PROJECT_REF || "pqqhqkqovxvusxktcuce";
  if (!password) {
    dbUrlCache = null;
    return null;
  }
  const host = process.env.SUPABASE_DB_HOST || `db.${ref}.supabase.co`;
  dbUrlCache = `postgresql://postgres:${encodeURIComponent(password)}@${host}:5432/postgres`;
  return dbUrlCache;
}

export function isYoutubeDbConfigured(): boolean {
  return Boolean(buildYoutubeDbUrl());
}

const ENSURE_TABLES_SQL = `
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS youtube_videos (
  video_id TEXT PRIMARY KEY,
  channel_handle TEXT NOT NULL DEFAULT 'With_ps',
  title TEXT,
  url TEXT NOT NULL,
  scripts JSONB,
  segment_count INTEGER DEFAULT 0,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS youtube_rag_chunks (
  id TEXT PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES youtube_videos(video_id) ON DELETE CASCADE,
  title TEXT,
  url TEXT,
  start_seconds INTEGER NOT NULL,
  end_seconds INTEGER,
  timestamp TEXT,
  speaker TEXT DEFAULT '원장님',
  text TEXT NOT NULL,
  deep_link TEXT,
  embedding extensions.vector(768),
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_youtube_rag_chunks_video_id
  ON youtube_rag_chunks (video_id);
`;

export async function ensureYoutubeTables(): Promise<void> {
  const dbUrl = buildYoutubeDbUrl();
  if (!dbUrl) return;

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    await client.query(ENSURE_TABLES_SQL);
  } finally {
    await client.end();
  }
}

let chunkDbCache: YoutubeChunk[] | null = null;

export async function loadYoutubeChunksFromDb(): Promise<YoutubeChunk[]> {
  if (chunkDbCache) return chunkDbCache;

  const dbUrl = buildYoutubeDbUrl();
  if (!dbUrl) return [];

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query<{
      id: string;
      video_id: string;
      url: string | null;
      title: string | null;
      start_seconds: number;
      end_seconds: number | null;
      timestamp: string | null;
      speaker: string | null;
      text: string;
      deep_link: string | null;
    }>(`
      SELECT id, video_id, url, title, start_seconds, end_seconds,
             timestamp, speaker, text, deep_link
      FROM youtube_rag_chunks
      ORDER BY video_id, start_seconds
    `);

    chunkDbCache = result.rows.map((row) => ({
      id: row.id,
      video_id: row.video_id,
      url: row.url || `https://youtu.be/${row.video_id}`,
      title: row.title || "",
      start_seconds: row.start_seconds,
      end_seconds: row.end_seconds ?? row.start_seconds + 3,
      timestamp: row.timestamp || "00:00",
      speaker: row.speaker || "원장님",
      text: row.text,
      deep_link: row.deep_link || `https://youtu.be/${row.video_id}?t=${row.start_seconds}`,
    }));
    return chunkDbCache;
  } catch (error) {
    console.error("[youtube-db] load chunks failed:", error);
    return [];
  } finally {
    await client.end();
  }
}

export function clearYoutubeDbCache(): void {
  chunkDbCache = null;
}

function mapDbRowToChunk(row: {
  id: string;
  video_id: string;
  url: string | null;
  title: string | null;
  start_seconds: number;
  end_seconds: number | null;
  timestamp: string | null;
  speaker: string | null;
  text: string;
  deep_link: string | null;
}): YoutubeChunk {
  return {
    id: row.id,
    video_id: row.video_id,
    url: row.url || `https://youtu.be/${row.video_id}`,
    title: row.title || "",
    start_seconds: row.start_seconds,
    end_seconds: row.end_seconds ?? row.start_seconds + 3,
    timestamp: row.timestamp || "00:00",
    speaker: row.speaker || "원장님",
    text: row.text,
    deep_link: row.deep_link || `https://youtu.be/${row.video_id}?t=${row.start_seconds}`,
  };
}

/** ID 목록으로 DB에서 청크만 로드 (전체 스캔 없음) */
export async function loadYoutubeChunksByIds(ids: string[]): Promise<YoutubeChunk[]> {
  if (!ids.length) return [];
  const dbUrl = buildYoutubeDbUrl();
  if (!dbUrl) return [];

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query<{
      id: string;
      video_id: string;
      url: string | null;
      title: string | null;
      start_seconds: number;
      end_seconds: number | null;
      timestamp: string | null;
      speaker: string | null;
      text: string;
      deep_link: string | null;
    }>(
      `SELECT id, video_id, url, title, start_seconds, end_seconds,
              timestamp, speaker, text, deep_link
       FROM youtube_rag_chunks
       WHERE id = ANY($1::text[])`,
      [ids]
    );

    const byId = new Map(result.rows.map((row) => [row.id, mapDbRowToChunk(row)]));
    return ids.map((id) => byId.get(id)).filter((c): c is YoutubeChunk => Boolean(c));
  } catch (error) {
    console.error("[youtube-db] load by ids failed:", error);
    return [];
  } finally {
    await client.end();
  }
}

/** pgvector 코사인 유사도 — DB에서 직접 Top-K 검색 */
export async function vectorSearchChunksInDb(
  query: string,
  limit = 10
): Promise<YoutubeChunk[]> {
  if (!query.trim() || !process.env.GEMINI_API_KEY) return [];
  const dbUrl = buildYoutubeDbUrl();
  if (!dbUrl) return [];

  let queryVector: number[];
  try {
    queryVector = await embedQuery(query);
  } catch (error) {
    console.error("[youtube-db] embed query failed:", error);
    return [];
  }

  const vectorLiteral = `[${queryVector.join(",")}]`;
  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const result = await client.query<{
      id: string;
      video_id: string;
      url: string | null;
      title: string | null;
      start_seconds: number;
      end_seconds: number | null;
      timestamp: string | null;
      speaker: string | null;
      text: string;
      deep_link: string | null;
      score: number;
    }>(
      `SELECT id, video_id, url, title, start_seconds, end_seconds,
              timestamp, speaker, text, deep_link,
              1 - (embedding <=> $1::extensions.vector) AS score
       FROM youtube_rag_chunks
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::extensions.vector
       LIMIT $2`,
      [vectorLiteral, limit]
    );
    return result.rows.map(mapDbRowToChunk);
  } catch (error) {
    console.error("[youtube-db] vector search failed:", error);
    return [];
  } finally {
    await client.end();
  }
}

export async function getYoutubeDbStats(): Promise<{
  videos: number;
  chunks: number;
  source: "db" | "none";
} | null> {
  const dbUrl = buildYoutubeDbUrl();
  if (!dbUrl) return null;

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  try {
    await client.connect();
    const videos = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM youtube_videos"
    );
    const chunks = await client.query<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM youtube_rag_chunks"
    );
    return {
      videos: Number(videos.rows[0]?.count ?? 0),
      chunks: Number(chunks.rows[0]?.count ?? 0),
      source: "db",
    };
  } catch {
    return null;
  } finally {
    await client.end();
  }
}
