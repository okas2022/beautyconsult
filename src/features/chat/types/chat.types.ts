export type MessageRole = "user" | "assistant";

export type YoutubeContentType = "video" | "short";

/** RAG 검색 결과 — 해당 타임스탬프에서 YouTube 재생 */
export interface YoutubeVideoRef {
  video_id: string;
  url: string;
  title: string;
  content_type?: YoutubeContentType;
  start_seconds: number;
  timestamp: string;
  deep_link: string;
  label: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  videoRefs?: YoutubeVideoRef[];
  nextActions?: string[];
}

export interface ChatApiRequest {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
  tenantId?: string;
}

export interface ChatApiResponse {
  reply: string;
  videoRefs?: YoutubeVideoRef[];
  model?: string;
  source?: "gemini" | "fallback";
  error?: string;
}
