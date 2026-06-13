import fs from "fs";
import path from "path";
import { Pinecone } from "@pinecone-database/pinecone";
import {
  cosineSimilarity,
  embedQuery,
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL,
} from "./gemini-embeddings";
import type { YoutubeChunk } from "./youtube-types";

export type VectorSearchHit = {
  id: string;
  score: number;
  source: "pinecone" | "local";
};

interface StoredEmbeddingsFile {
  model: string;
  dimension: number;
  updated_at: string;
  vectors: Array<{ id: string; values: number[] }>;
}

let localVectorCache: Map<string, number[]> | null = null;

function getPineconeConfig() {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  const indexName = process.env.PINECONE_INDEX?.trim() || "withsiljang-youtube";
  const namespace = process.env.PINECONE_NAMESPACE?.trim() || "chunks";
  if (!apiKey) return null;
  return { apiKey, indexName, namespace };
}

function embeddingsFilePath(): string {
  return path.join(process.cwd(), "data", "youtube", "videos_embeddings.json");
}

function loadLocalVectors(): Map<string, number[]> {
  if (localVectorCache) return localVectorCache;
  const filePath = embeddingsFilePath();
  if (!fs.existsSync(filePath)) {
    localVectorCache = new Map();
    return localVectorCache;
  }
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf-8")) as StoredEmbeddingsFile;
  localVectorCache = new Map(parsed.vectors.map((v) => [v.id, v.values]));
  return localVectorCache;
}

export function hasVectorIndex(): boolean {
  return Boolean(getPineconeConfig()) || loadLocalVectors().size > 0;
}

export function getVectorIndexStats(): {
  backend: "pinecone" | "local" | "none";
  vectors: number;
  model: string;
  dimension: number;
} {
  const pinecone = getPineconeConfig();
  const local = loadLocalVectors();
  if (pinecone) {
    return {
      backend: "pinecone",
      vectors: local.size,
      model: EMBEDDING_MODEL,
      dimension: EMBEDDING_DIMENSION,
    };
  }
  if (local.size > 0) {
    return {
      backend: "local",
      vectors: local.size,
      model: EMBEDDING_MODEL,
      dimension: EMBEDDING_DIMENSION,
    };
  }
  return { backend: "none", vectors: 0, model: EMBEDDING_MODEL, dimension: EMBEDDING_DIMENSION };
}

async function searchPinecone(queryVector: number[], limit: number): Promise<VectorSearchHit[]> {
  const config = getPineconeConfig();
  if (!config) return [];

  const pc = new Pinecone({ apiKey: config.apiKey });
  const index = pc.index(config.indexName);
  const response = await index.namespace(config.namespace).query({
    vector: queryVector,
    topK: limit,
    includeMetadata: true,
  });

  return (response.matches ?? [])
    .filter((m) => m.id && typeof m.score === "number")
    .map((m) => ({
      id: m.id!,
      score: m.score!,
      source: "pinecone" as const,
    }));
}

function searchLocal(queryVector: number[], limit: number): VectorSearchHit[] {
  const vectors = loadLocalVectors();
  if (!vectors.size) return [];

  const ranked = [...vectors.entries()]
    .map(([id, values]) => ({
      id,
      score: cosineSimilarity(queryVector, values),
      source: "local" as const,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ranked;
}

export async function vectorSearchChunkIds(query: string, limit = 10): Promise<VectorSearchHit[]> {
  if (!query.trim() || !process.env.GEMINI_API_KEY) return [];
  if (!hasVectorIndex()) return [];

  try {
    const queryVector = await embedQuery(query);
    const config = getPineconeConfig();

    if (config) {
      const hits = await searchPinecone(queryVector, limit);
      if (hits.length) return hits;
    }

    return searchLocal(queryVector, limit);
  } catch (error) {
    console.error("[youtube-vector-search] error:", error);
    return [];
  }
}

export function hydrateChunksByIds(
  chunks: YoutubeChunk[],
  hits: VectorSearchHit[]
): YoutubeChunk[] {
  const byId = new Map(chunks.map((c) => [c.id, c]));
  const seen = new Set<string>();
  const results: YoutubeChunk[] = [];

  for (const hit of hits) {
    const chunk = byId.get(hit.id);
    if (!chunk) continue;
    const key = `${chunk.video_id}:${chunk.start_seconds}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(chunk);
  }
  return results;
}
