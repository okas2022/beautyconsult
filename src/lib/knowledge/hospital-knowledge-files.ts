import fs from "fs";
import {
  resolveHospitalKnowledgePaths,
} from "@/features/hospitals/constants/hospitals";
import {
  loadVideosKnowledge,
  resolveKnowledgePath,
} from "@/lib/knowledge/load-videos-knowledge";
import type { VideoKnowledge } from "@/lib/knowledge/types";

export function hospitalKnowledgeFileExists(hospitalId: string): boolean {
  const paths = resolveHospitalKnowledgePaths(hospitalId);
  if (!paths.length) return false;
  return paths.some((relativePath) => {
    try {
      return fs.existsSync(resolveKnowledgePath(undefined, relativePath));
    } catch {
      return false;
    }
  });
}

export async function loadFileKnowledgeForHospital(
  hospitalId: string,
): Promise<VideoKnowledge[]> {
  const paths = resolveHospitalKnowledgePaths(hospitalId);
  if (!paths.length) return [];

  const merged: VideoKnowledge[] = [];
  const seen = new Set<string>();

  for (const relativePath of paths) {
    const videos = await loadVideosKnowledge(undefined, relativePath);
    for (const video of videos) {
      const key = `${video.video_id}:${video.scripts[0]?.seconds ?? 0}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(video);
    }
  }

  return merged;
}
