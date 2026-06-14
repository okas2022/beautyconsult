import {
  getHospitalCatalogEntry,
  type HospitalCatalogEntry,
} from "@/features/hospitals/constants/hospitals";

/** 구독(유료) 병원 콘텐츠 — 앱 내 영상 노출 시 광고 표시 의무 */
export function hospitalRequiresAdDisclosure(
  hospital: HospitalCatalogEntry | string | null | undefined,
): boolean {
  const entry =
    typeof hospital === "string"
      ? getHospitalCatalogEntry(hospital)
      : hospital;
  return Boolean(entry?.isSubscribed);
}

export function applyAdDisclosureToVideoRefs<
  T extends { is_ad?: boolean },
>(refs: T[], hospitalId: string): Array<T & { is_ad: boolean }> {
  const isAd = hospitalRequiresAdDisclosure(hospitalId);
  return refs.map((ref) => ({ ...ref, is_ad: ref.is_ad ?? isAd }));
}
