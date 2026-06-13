export interface HospitalCatalogEntry {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  youtubeHandle: string;
  channelUrl: string;
  /** 로컬 RAG 파일 (DB 없을 때 fallback) */
  knowledgePath: string;
  isSubscribed: boolean;
}

/** 위드성형외과 — 기본 제휴 병원 */
export const WITH_HOSPITAL_ID = "00000000-0000-0000-0000-000000000001";

/** 아이디병원 (ID Hospital) */
export const ID_HOSPITAL_ID = "00000000-0000-0000-0000-000000000002";

export const HOSPITAL_CATALOG: HospitalCatalogEntry[] = [
  {
    id: WITH_HOSPITAL_ID,
    slug: "with",
    name: "위드성형외과",
    shortName: "위드",
    youtubeHandle: "@With_ps",
    channelUrl: "https://www.youtube.com/@With_ps/videos",
    knowledgePath: "videos_knowledge.json",
    isSubscribed: true,
  },
  {
    id: ID_HOSPITAL_ID,
    slug: "id-hospital",
    name: "아이디병원",
    shortName: "ID",
    youtubeHandle: "@IDhospital",
    channelUrl: "https://www.youtube.com/@IDhospital/videos",
    knowledgePath: "data/hospitals/id-hospital/videos_knowledge.json",
    isSubscribed: true,
  },
];

export function getHospitalCatalogEntry(
  hospitalId: string,
): HospitalCatalogEntry | undefined {
  return HOSPITAL_CATALOG.find((h) => h.id === hospitalId);
}

export function resolveHospitalKnowledgePath(hospitalId: string): string | undefined {
  return getHospitalCatalogEntry(hospitalId)?.knowledgePath;
}
