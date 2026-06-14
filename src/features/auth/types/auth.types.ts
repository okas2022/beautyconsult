export const USAGE_PURPOSE_OPTIONS = [
  "피부·성형 AI 상담",
  "시술·트렌드 정보 탐색",
  "가상 성형 시뮬레이션",
  "병원·비용 비교",
  "기타",
] as const;

export type UsagePurpose = (typeof USAGE_PURPOSE_OPTIONS)[number];

export interface MemberProfile {
  id: string;
  full_name: string;
  birth_yymmdd: string;
  birth_gender_digit: string;
  road_address: string;
  road_address_detail: string | null;
  zip_code: string | null;
  phone_number: string;
  usage_purpose: string;
  is_guest: boolean;
  guest_chat_count: number;
  created_at: string;
}

export interface SignupPayload {
  full_name: string;
  birth_yymmdd: string;
  birth_gender_digit: string;
  road_address: string;
  road_address_detail?: string;
  zip_code?: string;
  phone_number: string;
  usage_purpose: string;
}

export interface LoginPayload {
  phone_number: string;
  birth_yymmdd: string;
  birth_gender_digit: string;
}

export interface JusoAddressItem {
  roadAddr: string;
  jibunAddr: string;
  zipNo: string;
  bdNm?: string;
}

export type AuthMode = "none" | "guest" | "member";

/** 둘러보기(게스트) 채팅 허용 횟수 */
export const GUEST_CHAT_LIMIT = 1;
