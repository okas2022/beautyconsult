export type AdPlacementId =
  | "chat_messages_top"
  | "chat_input_above"
  | "trend_feed_top"
  | "mypage_membership_below"
  | "simulate_header_below";

export type AdMediaType = "image" | "video";

export interface AdPlacementMeta {
  id: AdPlacementId;
  label: string;
  description: string;
  aspectRatio: string;
  maxHeight?: number;
}

export interface AdPlacement {
  id: AdPlacementId;
  label: string;
  description: string;
  is_enabled: boolean;
  media_type: AdMediaType | null;
  media_url: string | null;
  click_url: string | null;
  alt_text: string | null;
  updated_at: string | null;
}

export interface UpdateAdPlacementRequest {
  is_enabled?: boolean;
  media_type?: AdMediaType | null;
  media_url?: string | null;
  click_url?: string | null;
  alt_text?: string | null;
}
