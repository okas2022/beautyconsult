export interface VideoTranscriptSegment {
  seconds: number;
  timestamp: string;
  speaker: string;
  text: string;
}

export interface Hospital {
  id: string;
  name: string;
  is_subscribed: boolean;
  created_at: string;
}

export interface HospitalVideo {
  id: string;
  video_id: string;
  hospital_id: string;
  title: string | null;
  url: string;
  transcripts: VideoTranscriptSegment[];
  created_at: string;
}

export interface AddHospitalVideoRequest {
  url: string;
  hospital_id?: string;
}
