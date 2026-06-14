import type { BillingCycle, PlanTier } from "@/features/premium/constants/plans";

export interface MembershipUsage {
  simulateUsed: number;
  simulateLimit: number | null;
  simulateMonth: string;
}

export interface MembershipStatus {
  user_id: string;
  plan_tier: PlanTier;
  is_premium: boolean;
  billing_cycle: BillingCycle | null;
  premium_since: string | null;
  premium_until: string | null;
  usage: MembershipUsage;
}

export interface SubscribeRequest {
  user_id: string;
  billing_cycle?: BillingCycle;
}

export interface SubscribeResponse {
  success: boolean;
  user_id: string;
  is_premium: boolean;
  plan_tier: PlanTier;
  billing_cycle: BillingCycle;
  premium_since: string | null;
  premium_until: string | null;
  message: string;
}

export interface SkinReportScores {
  hydration: number;
  barrier: number;
  pigmentation: number;
  elasticity: number;
}

export interface SkinReport {
  report_id: string;
  generated_at: string;
  summary: string;
  scores: SkinReportScores;
  recommendations: string[];
}
