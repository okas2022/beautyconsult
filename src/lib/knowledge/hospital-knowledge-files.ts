import fs from "fs";
import {
  resolveHospitalKnowledgePath,
} from "@/features/hospitals/constants/hospitals";
import {
  loadVideosKnowledge,
  resolveKnowledgePath,
} from "@/lib/knowledge/load-videos-knowledge";
import type { VideoKnowledge } from "@/lib/knowledge/types";

export function hospitalKnowledgeFileExists(hospitalId: string): boolean {
  const relativePath = resolveHospitalKnowledgePath(hospitalId);
  if (!relativePath) return false;
  try {
    return fs.existsSync(resolveKnowledgePath(undefined, relativePath));
  } catch {
    return false;
  }
}

export async function loadFileKnowledgeForHospital(
  hospitalId: string,
): Promise<VideoKnowledge[]> {
  const relativePath = resolveHospitalKnowledgePath(hospitalId);
  if (!relativePath) return [];
  return loadVideosKnowledge(undefined, relativePath);
}
