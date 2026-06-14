import type { Product } from "@/features/commerce/types/product.types";

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
  /** 유료 제휴 병원 영상 — 앱 내 노출 시 AD 표시 */
  is_ad?: boolean;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  videoRefs?: YoutubeVideoRef[];
  symptomKeywords?: string[];
  products?: Product[];
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
  symptomKeywords?: string[];
  products?: Product[];
  nextActions?: string[];
  model?: string;
  source?: "gemini" | "fallback";
  error?: string;
}
