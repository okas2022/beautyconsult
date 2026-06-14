import type { AdPlacementId, AdPlacementMeta } from "@/features/ads/types/ad.types";

export const AD_PLACEMENT_CATALOG: AdPlacementMeta[] = [
  {
    id: "chat_messages_top",
    label: "상담하기 · 대화 상단",
    description: "환영 메시지 아래, 대화 목록 최상단",
    aspectRatio: "2.5/1",
    maxHeight: 120,
  },
  {
    id: "chat_input_above",
    label: "상담하기 · 입력창 위",
    description: "채팅 입력창 바로 위 배너",
    aspectRatio: "3.5/1",
    maxHeight: 88,
  },
  {
    id: "trend_feed_top",
    label: "트렌드 · 피드 상단",
    description: "랭킹 캐러셀 아래, Q&A 피드 위",
    aspectRatio: "16/9",
    maxHeight: 160,
  },
  {
    id: "mypage_membership_below",
    label: "마이페이지 · 멤버십 아래",
    description: "Premium 카드와 메뉴 사이",
    aspectRatio: "16/9",
    maxHeight: 140,
  },
  {
    id: "simulate_header_below",
    label: "시뮬레이터 · 헤더 아래",
    description: "멤버십 카드 아래, 업로드 영역 위",
    aspectRatio: "16/9",
    maxHeight: 140,
  },
];

export const AD_PLACEMENT_IDS = AD_PLACEMENT_CATALOG.map(
  (p) => p.id,
) as AdPlacementId[];

export function getPlacementMeta(id: AdPlacementId): AdPlacementMeta {
  return (
    AD_PLACEMENT_CATALOG.find((p) => p.id === id) ?? AD_PLACEMENT_CATALOG[0]
  );
}
