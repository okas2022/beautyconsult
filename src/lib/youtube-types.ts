export type YoutubeContentType = "video" | "short";

export interface YoutubeChunk {
  id: string;
  video_id: string;
  url: string;
  title: string;
  content_type?: YoutubeContentType;
  start_seconds: number;
  end_seconds: number;
  timestamp: string;
  speaker: string;
  text: string;
  deep_link: string;
}

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
