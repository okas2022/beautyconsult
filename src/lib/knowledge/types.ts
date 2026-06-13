export interface VideoScript {
  seconds: number;
  timestamp: string;
  speaker: string;
  text: string;
}

export interface VideoKnowledge {
  video_id: string;
  title: string;
  url: string;
  scripts: VideoScript[];
}
