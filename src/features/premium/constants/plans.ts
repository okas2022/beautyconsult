export type BillingCycle = "monthly" | "annual";
export type PlanTier = "free" | "premium";

/** 무료 회원 — 가상 성형 월간 체험 횟수 */
export const FREE_SIMULATE_MONTHLY_LIMIT = 1;

export interface PremiumPlanOption {
  id: BillingCycle;
  label: string;
  priceKrw: number;
  periodLabel: string;
  /** 월 환산 (연간 플랜) */
  monthlyEquivalentKrw?: number;
  savingsLabel?: string;
  badge?: string;
}

export const PREMIUM_PLANS: Record<BillingCycle, PremiumPlanOption> = {
  monthly: {
    id: "monthly",
    label: "월간",
    priceKrw: 9_900,
    periodLabel: "월",
    badge: "인기",
  },
  annual: {
    id: "annual",
    label: "연간",
    priceKrw: 69_000,
    periodLabel: "년",
    monthlyEquivalentKrw: 5_750,
    savingsLabel: "약 42% 절약",
  },
};

export interface PlanFeature {
  id: string;
  label: string;
  free: string | boolean;
  premium: string | boolean;
}

/** Free vs Premium 기능 비교 — 마이페이지·결제 화면 공통 */
export const PLAN_FEATURE_COMPARISON: PlanFeature[] = [
  {
    id: "chat",
    label: "AI 병원 상담 (유튜브 답변 제공)",
    free: true,
    premium: true,
  },
  {
    id: "cosmetics",
    label: "증상 맞춤 화장품 추천",
    free: "광고 포함",
    premium: "광고 포함 · 프리미엄 큐레이션",
  },
  {
    id: "simulate",
    label: "가상 성형 시뮬레이션",
    free: `월 ${FREE_SIMULATE_MONTHLY_LIMIT}회`,
    premium: "무제한",
  },
  {
    id: "skin-report",
    label: "AI 피부 정밀 리포트",
    free: false,
    premium: "무제한 · 히스토리 저장",
  },
  {
    id: "export",
    label: "Before/After HD 저장",
    free: false,
    premium: true,
  },
  {
    id: "priority",
    label: "합성 우선 처리",
    free: false,
    premium: true,
  },
];

export const PREMIUM_VALUE_PROPS = [
  "눈·코·가슴 가상 성형 무제한 시뮬레이션",
  "AI 피부 정밀 리포트 + 지난 기록 보관",
  "Before/After 결과 HD 저장",
  "Stable Diffusion 고급 합성 (Replicate)",
] as const;

export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function isPremiumActive(
  tier: PlanTier,
  premiumUntil: string | null | undefined,
): boolean {
  if (tier !== "premium") return false;
  if (!premiumUntil) return true;
  return new Date(premiumUntil).getTime() > Date.now();
}
