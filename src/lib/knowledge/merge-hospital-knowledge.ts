import type { VideoKnowledge } from "@/lib/knowledge/types";

export function isPlaceholderTranscript(text: string): boolean {
  return /^\[자동 요약\]/.test(text.trim());
}

function scriptKey(seconds: number, text: string): string {
  return `${seconds}:${text.trim().slice(0, 80)}`;
}

/** video_id별 세그먼트 병합 — DB·파일 소스 통합, 실제 자막 우선 */
export function mergeHospitalKnowledgeSources(
  sources: VideoKnowledge[][],
): VideoKnowledge[] {
  const byVideo = new Map<
    string,
    { title: string; url: string; scripts: Map<string, VideoKnowledge["scripts"][0]> }
  >();

  for (const list of sources) {
    for (const entry of list) {
      if (!entry.video_id || !entry.scripts?.length) continue;

      let bucket = byVideo.get(entry.video_id);
      if (!bucket) {
        bucket = {
          title: entry.title,
          url: entry.url,
          scripts: new Map(),
        };
        byVideo.set(entry.video_id, bucket);
      }

      if (entry.title) bucket.title = entry.title;
      if (entry.url) bucket.url = entry.url;

      for (const script of entry.scripts) {
        const key = scriptKey(script.seconds, script.text);
        const existing = bucket.scripts.get(key);
        if (!existing) {
          bucket.scripts.set(key, script);
          continue;
        }
        if (isPlaceholderTranscript(existing.text) && !isPlaceholderTranscript(script.text)) {
          bucket.scripts.set(key, script);
        }
      }
    }
  }

  const merged: VideoKnowledge[] = [];

  for (const [video_id, bucket] of byVideo) {
    const scripts = Array.from(bucket.scripts.values()).sort(
      (a, b) => a.seconds - b.seconds,
    );
    if (!scripts.length) continue;

    merged.push({
      video_id,
      title: bucket.title,
      url: bucket.url,
      scripts,
    });
  }

  return merged;
}

/** 검색 점수 — placeholder 자막 패널티 */
export function transcriptQualityBonus(text: string): number {
  return isPlaceholderTranscript(text) ? -12 : 0;
}
