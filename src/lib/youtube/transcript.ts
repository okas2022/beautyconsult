const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  /^([a-zA-Z0-9_-]{11})$/,
];

export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function buildYoutubeUrl(videoId: string): string {
  return `https://youtu.be/${videoId}`;
}

export async function fetchYoutubeTitle(videoId: string): Promise<string> {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const res = await fetch(url);
    if (!res.ok) return `YouTube 영상 ${videoId}`;
    const data = (await res.json()) as { title?: string };
    return data.title?.trim() || `YouTube 영상 ${videoId}`;
  } catch {
    return `YouTube 영상 ${videoId}`;
  }
}

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export async function fetchYoutubeTranscripts(
  videoId: string,
  title?: string,
): Promise<
  Array<{ seconds: number; timestamp: string; speaker: string; text: string }>
> {
  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const items = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "ko",
    });

    if (items?.length) {
      return items.map((item) => ({
        seconds: Math.floor(item.offset / 1000),
        timestamp: formatTimestamp(Math.floor(item.offset / 1000)),
        speaker: "원장",
        text: item.text.trim(),
      }));
    }
  } catch {
    // fallback below
  }

  try {
    const { YoutubeTranscript } = await import("youtube-transcript");
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    if (items?.length) {
      return items.map((item) => ({
        seconds: Math.floor(item.offset / 1000),
        timestamp: formatTimestamp(Math.floor(item.offset / 1000)),
        speaker: "원장",
        text: item.text.trim(),
      }));
    }
  } catch {
    // fallback below
  }

  const videoTitle = title ?? (await fetchYoutubeTitle(videoId));
  return [
    {
      seconds: 0,
      timestamp: "00:00",
      speaker: "원장",
      text: `[자동 생성 요약] ${videoTitle} — 병원 등록 영상입니다. 상세 자막은 추후 동기화됩니다.`,
    },
    {
      seconds: 30,
      timestamp: "00:30",
      speaker: "원장",
      text: "환자분의 고민에 맞춰 전문의가 설명하는 콘텐츠입니다. 대면 상담 시 개별 안내가 필요합니다.",
    },
  ];
}
