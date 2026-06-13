export interface TrendYoutubeRef {
  video_id: string;
  title: string;
  thumbnail_url: string;
}

export interface TrendFeedItem {
  id: string;
  area_tag: string;
  question_summary: string;
  answer_preview: string;
  youtube: TrendYoutubeRef;
  asked_ago: string;
  view_count: number;
  /** 채팅으로 넘길 때 사용할 전체 질문 */
  prompt_for_chat: string;
}

export interface TrendTopQuestion {
  rank: number;
  label: string;
  count: number;
  percent: number;
  icon: "eye" | "nose" | "breast" | "skin" | "jaw" | "lifting";
}

export interface TrendSimOption {
  label: string;
  procedure: string;
  percent: number;
  trend: "up" | "stable" | "new";
}

export interface TrendRankingData {
  top_questions: TrendTopQuestion[];
  popular_simulations: TrendSimOption[];
}

export interface TrendFeedData {
  updated_at: string;
  rankings: TrendRankingData;
  feed: TrendFeedItem[];
}
