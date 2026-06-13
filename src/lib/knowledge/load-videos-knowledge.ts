import fs from "fs";
import path from "path";
import type { VideoKnowledge } from "@/lib/knowledge/types";

let cachedKnowledge: VideoKnowledge[] | null = null;
let cachedPath: string | null = null;

/** 멀티 테넌트 / 병원별 knowledge 파일 경로 */
export function resolveKnowledgePath(
  tenantId?: string,
  relativePath?: string,
): string {
  if (relativePath) {
    return path.join(process.cwd(), relativePath);
  }
  if (tenantId) {
    return path.join(process.cwd(), "data", "tenants", tenantId, "videos_knowledge.json");
  }
  return path.join(process.cwd(), "videos_knowledge.json");
}

export async function loadVideosKnowledge(
  tenantId?: string,
  relativePath?: string,
): Promise<VideoKnowledge[]> {
  const filePath = resolveKnowledgePath(tenantId, relativePath);

  if (cachedKnowledge && cachedPath === filePath) {
    return cachedKnowledge;
  }

  try {
    const raw = await fs.promises.readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw) as VideoKnowledge[];

    if (!Array.isArray(parsed)) {
      throw new Error("videos_knowledge.json must be an array");
    }

    cachedKnowledge = parsed.filter(
      (v) => v?.video_id && Array.isArray(v.scripts) && v.scripts.length > 0,
    );
    cachedPath = filePath;
    return cachedKnowledge;
  } catch (error) {
    console.error("[load-videos-knowledge] failed:", filePath, error);
    return [];
  }
}

export function formatKnowledgeAsContext(videos: VideoKnowledge[]): string {
  if (!videos.length) {
    return "(유튜브 대본 데이터 없음)";
  }

  const blocks = videos.map((video) => {
    const header = `[영상 ID: ${video.video_id} | 제목: ${video.title} | URL: ${video.url}]`;
    const scripts = video.scripts
      .map(
        (s) =>
          `[${s.timestamp} (${s.seconds}s) | ${s.speaker}] ${s.text.trim()}`,
      )
      .join("\n");
    return `${header}\n${scripts}`;
  });

  return blocks.join("\n\n---\n\n");
}

export async function loadKnowledgeContext(tenantId?: string): Promise<string> {
  const videos = await loadVideosKnowledge(tenantId);
  return formatKnowledgeAsContext(videos);
}
