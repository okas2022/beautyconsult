import type { VideoKnowledge } from "@/lib/knowledge/types";
import type { HospitalVideo } from "@/features/hospitals/types/hospital.types";
import {
  formatKnowledgeAsContext,
} from "@/lib/knowledge/load-videos-knowledge";
import {
  isHospitalSubscribed,
  loadSubscribedVideosForRag,
} from "@/lib/hospitals/hospital-video-service";
import {
  getHospitalCatalogEntry,
} from "@/features/hospitals/constants/hospitals";
import {
  loadFileKnowledgeForHospital,
} from "@/lib/knowledge/hospital-knowledge-files";
import { DEFAULT_HOSPITAL_ID } from "@/features/leads/types/lead.types";

function hospitalVideosToKnowledge(videos: HospitalVideo[]): VideoKnowledge[] {
  return videos
    .filter((v) => v.transcripts?.length > 0)
    .map((v) => ({
      video_id: v.video_id,
      title: v.title ?? v.video_id,
      url: v.url,
      scripts: v.transcripts,
    }));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length >= 2);
}

function scoreSegment(text: string, queryTokens: Set<string>, rawQuery: string): number {
  const lower = text.toLowerCase();
  const compact = rawQuery.replace(/\s+/g, "").toLowerCase();
  let score = 0;
  for (const token of queryTokens) {
    if (lower.includes(token)) score += token.length >= 3 ? 3 : 1;
  }
  if (compact.length >= 2 && lower.replace(/\s+/g, "").includes(compact)) {
    score += 8;
  }
  return score;
}

export function searchHospitalKnowledge(
  videos: VideoKnowledge[],
  query: string,
  limit = 8,
): VideoKnowledge[] {
  if (!videos.length || !query.trim()) return videos.slice(0, 3);

  const queryTokens = new Set(tokenize(query));
  const ranked: Array<{ video: VideoKnowledge; score: number }> = [];

  for (const video of videos) {
    for (const script of video.scripts) {
      const score = scoreSegment(script.text, queryTokens, query);
      if (score <= 0) continue;
      ranked.push({
        video: { ...video, scripts: [script] },
        score,
      });
    }
  }

  ranked.sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: VideoKnowledge[] = [];

  for (const { video } of ranked) {
    const key = `${video.video_id}:${video.scripts[0]?.seconds ?? 0}`;
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(video);
    if (results.length >= limit) break;
  }

  return results.length ? results : videos.slice(0, 2);
}

export interface HospitalRagResult {
  context: string;
  videos: VideoKnowledge[];
  source: "hospital_db" | "file_fallback" | "none";
  subscribed: boolean;
}

export async function loadHospitalRagContext(
  query: string,
  hospitalId: string = DEFAULT_HOSPITAL_ID,
): Promise<HospitalRagResult> {
  const catalog = getHospitalCatalogEntry(hospitalId);
  const subscribed = await isHospitalSubscribed(hospitalId);

  if (!subscribed) {
    return {
      context: "(구독하지 않은 병원 — RAG 검색 대상 영상 없음)",
      videos: [],
      source: "none",
      subscribed: false,
    };
  }

  const hospitalVideos = await loadSubscribedVideosForRag(hospitalId);
  const dbKnowledge = hospitalVideosToKnowledge(hospitalVideos);

  if (dbKnowledge.length) {
    const relevant = searchHospitalKnowledge(dbKnowledge, query);
    return {
      context: formatKnowledgeAsContext(relevant),
      videos: relevant,
      source: "hospital_db",
      subscribed: true,
    };
  }

  const fileKnowledge = await loadFileKnowledgeForHospital(hospitalId);
  if (!fileKnowledge.length) {
    return {
      context: `(등록된 ${catalog?.name ?? "병원"} 유튜브 데이터 없음)`,
      videos: [],
      source: "none",
      subscribed: true,
    };
  }

  const relevant = searchHospitalKnowledge(fileKnowledge, query);
  return {
    context: formatKnowledgeAsContext(relevant),
    videos: relevant,
    source: "file_fallback",
    subscribed: true,
  };
}

export async function loadHospitalKnowledgeForRefs(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
): Promise<VideoKnowledge[]> {
  if (!(await isHospitalSubscribed(hospitalId))) return [];

  const hospitalVideos = await loadSubscribedVideosForRag(hospitalId);
  const dbKnowledge = hospitalVideosToKnowledge(hospitalVideos);
  if (dbKnowledge.length) return dbKnowledge;

  return loadFileKnowledgeForHospital(hospitalId);
}
