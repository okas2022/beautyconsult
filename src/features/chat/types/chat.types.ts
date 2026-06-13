export type MessageRole = "user" | "assistant";

export interface YouTubeReference {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
  duration?: string;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  youtubeRef?: YouTubeReference;
}
