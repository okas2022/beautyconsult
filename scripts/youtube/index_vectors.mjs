#!/usr/bin/env node
/**
 * Gemini Embedding → Pinecone (optional) + local videos_embeddings.json
 * Usage: node scripts/youtube/index_vectors.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { Pinecone } from "@pinecone-database/pinecone";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const CHUNKS_PATH = path.join(ROOT, "data/youtube/videos_chunks.json");
const EMBEDDINGS_PATH = path.join(ROOT, "data/youtube/videos_embeddings.json");
const ENV_PATH = path.join(ROOT, ".env.local");

const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSION = 768;
const BATCH_UPSERT = 100;
const EMBED_DELAY_MS = 120;

function loadEnv() {
  if (!fs.existsSync(ENV_PATH)) return;
  for (const line of fs.readFileSync(ENV_PATH, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function embedDocument(ai, text, title) {
  const content = title?.trim() ? `제목: ${title.trim()}\n내용: ${text}` : text;
  const response = await ai.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: content,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      title: title?.trim() || undefined,
      outputDimensionality: EMBEDDING_DIMENSION,
    },
  });
  const values = response.embeddings?.[0]?.values;
  if (!values?.length) throw new Error("Empty embedding");
  return values;
}

async function ensurePineconeIndex(pc, indexName) {
  const existing = (await pc.listIndexes()).indexes ?? [];
  if (existing.some((i) => i.name === indexName)) return;

  console.log(`Pinecone 인덱스 생성: ${indexName} (dim=${EMBEDDING_DIMENSION})`);
  await pc.createIndex({
    name: indexName,
    dimension: EMBEDDING_DIMENSION,
    metric: "cosine",
    spec: {
      serverless: {
        cloud: "aws",
        region: process.env.PINECONE_REGION || "us-east-1",
      },
    },
    waitUntilReady: true,
  });
}

async function upsertPinecone(vectors) {
  const apiKey = process.env.PINECONE_API_KEY?.trim();
  if (!apiKey) {
    console.log("PINECONE_API_KEY 없음 — 로컬 임베딩 파일만 저장합니다.");
    return;
  }

  const indexName = process.env.PINECONE_INDEX?.trim() || "withsiljang-youtube";
  const namespace = process.env.PINECONE_NAMESPACE?.trim() || "chunks";
  const pc = new Pinecone({ apiKey });
  await ensurePineconeIndex(pc, indexName);

  const index = pc.index(indexName);
  for (let i = 0; i < vectors.length; i += BATCH_UPSERT) {
    const batch = vectors.slice(i, i + BATCH_UPSERT);
    await index.namespace(namespace).upsert(batch);
    console.log(`  Pinecone upsert ${Math.min(i + BATCH_UPSERT, vectors.length)}/${vectors.length}`);
  }
  console.log(`✅ Pinecone upsert 완료 → ${indexName}/${namespace}`);
}

async function main() {
  loadEnv();

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY가 필요합니다 (.env.local)");
    process.exit(1);
  }
  if (!fs.existsSync(CHUNKS_PATH)) {
    console.error(`청크 파일 없음: ${CHUNKS_PATH}\n먼저 npm run youtube:sync 실행`);
    process.exit(1);
  }

  const chunks = JSON.parse(fs.readFileSync(CHUNKS_PATH, "utf-8"));
  console.log(`임베딩 생성 시작: ${chunks.length}개 청크 (${EMBEDDING_MODEL})`);

  const ai = new GoogleGenAI({ apiKey });
  const storedVectors = [];
  const pineconeVectors = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const values = await embedDocument(ai, chunk.text, chunk.title);
    storedVectors.push({ id: chunk.id, values });
    pineconeVectors.push({
      id: chunk.id,
      values,
      metadata: {
        video_id: chunk.video_id,
        title: (chunk.title || "").slice(0, 200),
        timestamp: chunk.timestamp,
        start_seconds: chunk.start_seconds,
        deep_link: chunk.deep_link,
      },
    });

    if ((i + 1) % 10 === 0 || i + 1 === chunks.length) {
      console.log(`  embedded ${i + 1}/${chunks.length}`);
    }
    if (EMBED_DELAY_MS > 0 && i + 1 < chunks.length) await sleep(EMBED_DELAY_MS);
  }

  const payload = {
    model: EMBEDDING_MODEL,
    dimension: EMBEDDING_DIMENSION,
    updated_at: new Date().toISOString(),
    vectors: storedVectors,
  };
  fs.writeFileSync(EMBEDDINGS_PATH, JSON.stringify(payload));
  console.log(`📝 local embeddings → ${EMBEDDINGS_PATH}`);

  await upsertPinecone(pineconeVectors);
  console.log("🎉 벡터 인덱싱 완료");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
