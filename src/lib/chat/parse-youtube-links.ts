import type { YoutubeVideoRef } from "@/features/chat/types/chat.types";
import type { VideoKnowledge } from "@/lib/knowledge/types";

const YOUTUBE_LINK_PATTERNS = [
  /https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)\?t=(\d+)/g,
  /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)&t=(\d+)/g,
] as const;

const ALL_LINKS_RE =
  /https?:\/\/(?:www\.)?(?:youtu\.be\/[a-zA-Z0-9_-]+\?t=\d+|youtube\.com\/watch\?v=[a-zA-Z0-9_-]+&t=\d+)/g;

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function resolveTitle(videoId: string, knowledge?: VideoKnowledge[]): string {
  const found = knowledge?.find((v) => v.video_id === videoId);
  return found?.title ?? "관련 전문의 영상";
}

export function extractVideoRefsFromText(
  text: string,
  knowledge?: VideoKnowledge[],
): YoutubeVideoRef[] {
  const refs: YoutubeVideoRef[] = [];
  const seen = new Set<string>();

  for (const pattern of YOUTUBE_LINK_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      const videoId = match[1];
      const seconds = Number(match[2]);
      if (!videoId || Number.isNaN(seconds)) continue;

      const key = `${videoId}:${seconds}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const timestamp = formatTimestamp(seconds);
      const title = resolveTitle(videoId, knowledge);
      const deepLink = `https://youtu.be/${videoId}?t=${seconds}`;

      refs.push({
        video_id: videoId,
        url: `https://youtu.be/${videoId}`,
        title,
        start_seconds: seconds,
        timestamp,
        deep_link: deepLink,
        label: `▶ ${title} (${timestamp})`,
      });
    }
  }

  return refs;
}

/** 메시지 본문에서 URL을 분리해 렌더링용 세그먼트 생성 */
export function splitMessageWithLinks(text: string): Array<{ type: "text" | "link"; value: string }> {
  const segments: Array<{ type: "text" | "link"; value: string }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(ALL_LINKS_RE)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }
    segments.push({ type: "link", value: match[0] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length ? segments : [{ type: "text", value: text }];
}
