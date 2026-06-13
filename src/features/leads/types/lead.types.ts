export type LeadStatus = "pending" | "contacted" | "visited";

export interface Lead {
  id: string;
  patient_id: string;
  hospital_id: string;
  phone_number: string;
  consultation_summary: string | null;
  status: LeadStatus;
  video_id: string | null;
  video_title: string | null;
  created_at: string;
}

export interface Hospital {
  id: string;
  name: string;
  is_subscribed?: boolean;
  created_at: string;
}

export interface CreateLeadRequest {
  phone_number: string;
  patient_id: string;
  hospital_id?: string;
  video_id?: string;
  video_title?: string;
  messages?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface CreateLeadResponse {
  id: string;
  status: LeadStatus;
  consultation_summary: string;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  pending: "접수 대기",
  contacted: "연락 완료",
  visited: "내원 완료",
};

export const DEFAULT_HOSPITAL_ID = "00000000-0000-0000-0000-000000000001";
