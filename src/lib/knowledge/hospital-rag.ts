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
import {
  mergeHospitalKnowledgeSources,
  transcriptQualityBonus,
} from "@/lib/knowledge/merge-hospital-knowledge";
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

/** 한국어 질문 → 영어 제목/자막 매칭 (해외 병원 채널) */
function expandQueryForSearch(query: string): string {
  const expansions: Array<{ pattern: RegExp; terms: string[] }> = [
    { pattern: /가슴|유방|보형물|모티바|cc|가슴성형|가슴수술/i, terms: ["breast", "mammoplasty", "implant"] },
    { pattern: /재수술|리비전/i, terms: ["revision", "reoperation"] },
    { pattern: /코|콧|비중격|매부리|코성형|콧볼/i, terms: ["nose", "nasal", "rhinoplasty", "tip"] },
    { pattern: /눈|쌍꺼풀|눈매|안검|눈성형|쌍수/i, terms: ["eye", "eyelid", "ptosis", "blepharoplasty"] },
    { pattern: /리프팅|처짐|탄력|주름/i, terms: ["lifting", "facelift", "sagging", "wrinkle"] },
    { pattern: /윤곽|사각턱|턱|지방흡입/i, terms: ["contouring", "jaw", "facial", "chin"] },
    { pattern: /피부|보톡스|필러|리쥬란|스킨/i, terms: ["skin", "filler", "booster", "rejuran"] },
    { pattern: /자외선|선크림|spf/i, terms: ["sunscreen", "spf", "sun"] },
    { pattern: /남자|남성|남성형/i, terms: ["men", "male"] },
  ];

  let expanded = query;
  for (const { pattern, terms } of expansions) {
    if (pattern.test(query)) expanded += ` ${terms.join(" ")}`;
  }
  return expanded;
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

  const expandedQuery = expandQueryForSearch(query);
  const queryTokens = new Set(tokenize(expandedQuery));
  const ranked: Array<{ video: VideoKnowledge; score: number }> = [];

  for (const video of videos) {
    const titleScore = scoreSegment(video.title, queryTokens, expandedQuery) * 2;
    for (const script of video.scripts) {
      const score =
        scoreSegment(script.text, queryTokens, expandedQuery) +
        titleScore +
        transcriptQualityBonus(script.text);
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
  source: "hospital_db" | "file_fallback" | "merged" | "none";
  subscribed: boolean;
}

async function loadMergedKnowledgeForHospital(
  hospitalId: string,
): Promise<{ knowledge: VideoKnowledge[]; source: HospitalRagResult["source"] }> {
  let dbKnowledge: VideoKnowledge[] = [];
  try {
    const hospitalVideos = await loadSubscribedVideosForRag(hospitalId);
    dbKnowledge = hospitalVideosToKnowledge(hospitalVideos);
  } catch (error) {
    console.warn("[loadMergedKnowledgeForHospital] DB load failed:", error);
  }

  const fileKnowledge = await loadFileKnowledgeForHospital(hospitalId);
  const merged = mergeHospitalKnowledgeSources([dbKnowledge, fileKnowledge]);

  if (dbKnowledge.length && fileKnowledge.length) {
    return { knowledge: merged, source: "merged" };
  }
  if (dbKnowledge.length) {
    return { knowledge: merged, source: "hospital_db" };
  }
  if (fileKnowledge.length) {
    return { knowledge: merged, source: "file_fallback" };
  }
  return { knowledge: [], source: "none" };
}

export async function loadHospitalRagContext(
  query: string,
  hospitalId: string = DEFAULT_HOSPITAL_ID,
): Promise<HospitalRagResult> {
  const catalog = getHospitalCatalogEntry(hospitalId);
  const subscribed = await isHospitalSubscribed(hospitalId);

  if (!subscribed) {
    return {
      context: "",
      videos: [],
      source: "none",
      subscribed: false,
    };
  }

  const { knowledge, source } = await loadMergedKnowledgeForHospital(hospitalId);

  if (!knowledge.length) {
    return {
      context: "",
      videos: [],
      source: "none",
      subscribed: true,
    };
  }

  const relevant = searchHospitalKnowledge(knowledge, query);
  return {
    context: formatKnowledgeAsContext(relevant),
    videos: relevant,
    source,
    subscribed: true,
  };
}

export async function loadHospitalKnowledgeForRefs(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
): Promise<VideoKnowledge[]> {
  if (!(await isHospitalSubscribed(hospitalId))) return [];
  const { knowledge } = await loadMergedKnowledgeForHospital(hospitalId);
  return knowledge;
}
