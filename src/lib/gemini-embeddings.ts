import { GoogleGenAI } from "@google/genai";

export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSION = 768;

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

function extractValues(response: Awaited<ReturnType<GoogleGenAI["models"]["embedContent"]>>): number[] {
  const values = response.embeddings?.[0]?.values;
  if (!values?.length) throw new Error("Empty embedding response");
  return values;
}

export async function embedQuery(text: string): Promise<number[]> {
  const response = await getAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: text,
    config: {
      taskType: "RETRIEVAL_QUERY",
      outputDimensionality: EMBEDDING_DIMENSION,
    },
  });
  return extractValues(response);
}

export async function embedDocument(text: string, title?: string): Promise<number[]> {
  const content = title?.trim()
    ? `제목: ${title.trim()}\n내용: ${text}`
    : text;

  const response = await getAI().models.embedContent({
    model: EMBEDDING_MODEL,
    contents: content,
    config: {
      taskType: "RETRIEVAL_DOCUMENT",
      title: title?.trim() || undefined,
      outputDimensionality: EMBEDDING_DIMENSION,
    },
  });
  return extractValues(response);
}

export async function embedDocumentsBatch(
  items: Array<{ text: string; title?: string }>,
  delayMs = 120
): Promise<number[][]> {
  const results: number[][] = [];
  for (const item of items) {
    results.push(await embedDocument(item.text, item.title));
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i]! * b[i]!;
    normA += a[i]! * a[i]!;
    normB += b[i]! * b[i]!;
  }
  if (!normA || !normB) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
