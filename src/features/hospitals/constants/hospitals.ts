/** 병원 네트워크 카테고리 — RAG 타겟 세그먼트 */
export type HospitalCategory = "mega" | "specialty" | "trend";

export type PartnershipStatus = "prospect" | "negotiating" | "active" | "paused";

export interface HospitalYoutubeChannel {
  label: string;
  handle?: string;
  url: string;
}

export interface HospitalPartnership {
  /** CPA/CPL 리드당 수수료 (원) — 협상 후 설정 */
  cpaFeeKrw: number | null;
  /** 전환(내원) 시 추가 수익 배분 % */
  revenueSharePct: number | null;
  status: PartnershipStatus;
}

export interface HospitalCatalogEntry {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  category: HospitalCategory;
  /** 전문 부위 태그 (RAG·필터용) */
  specialties: string[];
  youtubeChannels: HospitalYoutubeChannel[];
  /** 병합 RAG knowledge 파일 (repo 또는 DB sync) */
  knowledgePaths: string[];
  isSubscribed: boolean;
  partnership: HospitalPartnership;
  description?: string;
}

export const HOSPITAL_CATEGORY_LABELS: Record<HospitalCategory, string> = {
  mega: "메가 채널",
  specialty: "분야 특화",
  trend: "트렌드·MZ",
};

export const WITH_HOSPITAL_ID = "00000000-0000-0000-0000-000000000001";
export const ID_HOSPITAL_ID = "00000000-0000-0000-0000-000000000002";
export const DA_HOSPITAL_ID = "00000000-0000-0000-0000-000000000003";
export const BANOBAGI_HOSPITAL_ID = "00000000-0000-0000-0000-000000000004";
export const WONJIN_HOSPITAL_ID = "00000000-0000-0000-0000-000000000005";
export const MC365_HOSPITAL_ID = "00000000-0000-0000-0000-000000000006";
export const LIFTING_HOSPITAL_ID = "00000000-0000-0000-0000-000000000007";
export const MD_HOSPITAL_ID = "00000000-0000-0000-0000-000000000008";
export const RYAN_HOSPITAL_ID = "00000000-0000-0000-0000-000000000009";
export const AB_HOSPITAL_ID = "00000000-0000-0000-0000-00000000000a";
export const TS_HOSPITAL_ID = "00000000-0000-0000-0000-00000000000b";
export const BROWN_HOSPITAL_ID = "00000000-0000-0000-0000-00000000000c";

const defaultPartnership = (status: PartnershipStatus = "prospect"): HospitalPartnership => ({
  cpaFeeKrw: null,
  revenueSharePct: null,
  status,
});

export const HOSPITAL_CATALOG: HospitalCatalogEntry[] = [
  {
    id: WITH_HOSPITAL_ID,
    slug: "with",
    name: "위드성형외과",
    shortName: "위드",
    category: "mega",
    specialties: ["눈", "코", "가슴", "리프팅"],
    youtubeChannels: [
      {
        label: "본 채널",
        handle: "@With_ps",
        url: "https://www.youtube.com/@With_ps/videos",
      },
    ],
    knowledgePaths: ["videos_knowledge.json"],
    isSubscribed: true,
    partnership: { ...defaultPartnership("active"), cpaFeeKrw: 50000, revenueSharePct: 10 },
    description: "PoC 제휴 · 위드성형외과 롱폼·쇼츠",
  },
  {
    id: ID_HOSPITAL_ID,
    slug: "id-hospital",
    name: "아이디병원",
    shortName: "ID",
    category: "mega",
    specialties: ["눈", "코", "가슴", "양악", "윤곽"],
    youtubeChannels: [
      {
        label: "본 채널",
        handle: "@IDhospital",
        url: "https://www.youtube.com/@IDhospital/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/id-hospital/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "국내 최대 규모 · 부위별 Q&A·수술 리뷰 방대",
  },
  {
    id: DA_HOSPITAL_ID,
    slug: "da-plastic",
    name: "디에이성형외과",
    shortName: "DA",
    category: "mega",
    specialties: ["눈", "코", "가슴", "리프팅", "윤곽"],
    youtubeChannels: [
      {
        label: "본 채널",
        handle: "@DAPRS",
        url: "https://www.youtube.com/@DAPRS/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/da-plastic/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "쇼츠·브이로그 마케팅 강자",
  },
  {
    id: BANOBAGI_HOSPITAL_ID,
    slug: "banobagi",
    name: "바노바기성형외과",
    shortName: "바노바기",
    category: "mega",
    specialties: ["눈", "코", "가슴", "안티에이징"],
    youtubeChannels: [
      {
        label: "본 채널",
        url: "https://www.youtube.com/channel/UC2lzYQ5kXBK0gkVDe5StZzQ/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/banobagi/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "렛미인 시절부터 축적된 메이크오버·딥다이브 의학 영상",
  },
  {
    id: WONJIN_HOSPITAL_ID,
    slug: "wonjin",
    name: "원진성형외과",
    shortName: "원진",
    category: "mega",
    specialties: ["눈", "코", "가슴", "윤곽"],
    youtubeChannels: [
      {
        label: "본 채널",
        handle: "@wonjinps",
        url: "https://www.youtube.com/@wonjinps/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/wonjin/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "장기 누적 영상 · 다국어 글로벌 콘텐츠",
  },
  {
    id: MC365_HOSPITAL_ID,
    slug: "365mc",
    name: "365mc",
    shortName: "365",
    category: "specialty",
    specialties: ["지방흡입", "다이어트", "체형"],
    youtubeChannels: [
      {
        label: "지방이 채널",
        url: "https://www.youtube.com/channel/UCWswjI3a6IL0WP_xv5A3zpw/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/365mc/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "지방흡입 특화 · 지방이 캐릭터 IP",
  },
  {
    id: LIFTING_HOSPITAL_ID,
    slug: "lifting",
    name: "리팅성형외과",
    shortName: "리팅",
    category: "specialty",
    specialties: ["리프팅", "안면거상", "중년"],
    youtubeChannels: [
      {
        label: "본 채널",
        handle: "@liftingps",
        url: "https://www.youtube.com/@liftingps/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/lifting/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "안면거상·리프팅 특화 · 퍼포먼스 마케팅",
  },
  {
    id: MD_HOSPITAL_ID,
    slug: "md-breast",
    name: "엠디성형외과",
    shortName: "MD",
    category: "specialty",
    specialties: ["가슴", "보형물", "구형구축"],
    youtubeChannels: [
      {
        label: "엠디외과",
        url: "https://www.youtube.com/channel/UCEKTF51I3UiM19UetQqLxMQ/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/md-breast/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "가슴 성형 · 보형물 비교·구형구축 예방 설명",
  },
  {
    id: RYAN_HOSPITAL_ID,
    slug: "ryan",
    name: "라이안성형외과",
    shortName: "라이안",
    category: "specialty",
    specialties: ["가슴", "보형물"],
    youtubeChannels: [
      {
        label: "본 채널",
        url: "https://www.youtube.com/channel/UCRnC-G0jVHTdbtNwCg9T9lA/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/ryan/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "가슴 특화 · 환자 Q&A 영상",
  },
  {
    id: AB_HOSPITAL_ID,
    slug: "ab",
    name: "에이비성형외과",
    shortName: "AB",
    category: "trend",
    specialties: ["눈", "코", "윤곽"],
    youtubeChannels: [
      {
        label: "본 채널",
        handle: "@ABPlasticSurgery",
        url: "https://www.youtube.com/@ABPlasticSurgery/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/ab/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "2030 트렌디 영상 · MZ 타겟",
  },
  {
    id: TS_HOSPITAL_ID,
    slug: "ts",
    name: "티에스성형외과",
    shortName: "TS",
    category: "trend",
    specialties: ["눈", "코", "상담", "라이브"],
    youtubeChannels: [
      {
        label: "티에스TV",
        url: "https://www.youtube.com/channel/UCgnizu8p7lbCnfIs76O8J-A/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/ts/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "원장 직접 상담·라이브 클립 Speech 데이터 풍부",
  },
  {
    id: BROWN_HOSPITAL_ID,
    slug: "brown",
    name: "브라운성형외과",
    shortName: "브라운",
    category: "trend",
    specialties: ["코", "윤곽", "회복"],
    youtubeChannels: [
      {
        label: "본 채널",
        url: "https://www.youtube.com/channel/UCoq9seQbioEZ8UhsRV_lTvA/videos",
      },
    ],
    knowledgePaths: ["data/hospitals/brown/videos_knowledge.json"],
    isSubscribed: true,
    partnership: defaultPartnership("prospect"),
    description: "코·윤곽 리얼리티 · 회복기 영상",
  },
];

export function getHospitalCatalogEntry(
  hospitalId: string,
): HospitalCatalogEntry | undefined {
  return HOSPITAL_CATALOG.find((h) => h.id === hospitalId);
}

export function getHospitalBySlug(slug: string): HospitalCatalogEntry | undefined {
  const normalized = slug.trim().toLowerCase();
  return HOSPITAL_CATALOG.find((h) => h.slug.toLowerCase() === normalized);
}

export function resolveHospitalKnowledgePaths(hospitalId: string): string[] {
  return getHospitalCatalogEntry(hospitalId)?.knowledgePaths ?? [];
}

/** @deprecated 단일 path — 첫 번째 knowledge 파일 */
export function resolveHospitalKnowledgePath(hospitalId: string): string | undefined {
  return resolveHospitalKnowledgePaths(hospitalId)[0];
}

export function getHospitalsByCategory(
  category: HospitalCategory,
): HospitalCatalogEntry[] {
  return HOSPITAL_CATALOG.filter((h) => h.category === category);
}

export function getPrimaryYoutubeChannel(
  hospital: HospitalCatalogEntry,
): HospitalYoutubeChannel {
  return hospital.youtubeChannels[0];
}

/** 리퍼럴 수익 예상 (데모) */
export function estimateLeadValue(hospital: HospitalCatalogEntry): number | null {
  return hospital.partnership.cpaFeeKrw;
}
