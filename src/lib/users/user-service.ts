import { createAdminClient } from "@/lib/supabase/admin";
import {
  FREE_SIMULATE_MONTHLY_LIMIT,
  type BillingCycle,
  type PlanTier,
  isPremiumActive,
} from "@/features/premium/constants/plans";
import type { MembershipStatus, MembershipUsage } from "@/features/premium/types/premium.types";

export interface AppUser {
  id: string;
  is_premium: boolean;
  premium_since: string | null;
  created_at: string;
  plan_tier?: PlanTier;
  billing_cycle?: BillingCycle | null;
  premium_until?: string | null;
  simulate_usage_month?: string | null;
  simulate_usage_count?: number;
}

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addYears(date: Date, years: number): Date {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

function resolveTier(user: AppUser): PlanTier {
  if (user.plan_tier === "premium" || user.is_premium) {
    return isPremiumActive("premium", user.premium_until ?? null)
      ? "premium"
      : "free";
  }
  return "free";
}

function buildUsage(user: AppUser, tier: PlanTier): MembershipUsage {
  const month = currentMonthKey();
  const used =
    user.simulate_usage_month === month
      ? (user.simulate_usage_count ?? 0)
      : 0;

  return {
    simulateUsed: used,
    simulateLimit: tier === "premium" ? null : FREE_SIMULATE_MONTHLY_LIMIT,
    simulateMonth: month,
  };
}

export function buildMembershipStatus(user: AppUser): MembershipStatus {
  const tier = resolveTier(user);
  return {
    user_id: user.id,
    plan_tier: tier,
    is_premium: tier === "premium",
    billing_cycle: user.billing_cycle ?? null,
    premium_since: user.premium_since,
    premium_until: user.premium_until ?? null,
    usage: buildUsage(user, tier),
  };
}

export async function getOrCreateUser(userId: string): Promise<AppUser> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return existing as AppUser;

  const { data, error } = await supabase
    .from("users")
    .insert({ id: userId, is_premium: false, plan_tier: "free" })
    .select("*")
    .single();

  if (error) {
    console.error("[getOrCreateUser] error:", error);
    throw new Error("DB_ERROR");
  }

  return data as AppUser;
}

export async function getMembershipStatus(
  userId: string,
): Promise<MembershipStatus> {
  const user = await getOrCreateUser(userId);
  return buildMembershipStatus(user);
}

export async function isUserPremium(userId: string): Promise<boolean> {
  try {
    const status = await getMembershipStatus(userId);
    return status.is_premium;
  } catch {
    return false;
  }
}

export interface SimulateAccessResult {
  allowed: boolean;
  reason?: "PREMIUM_REQUIRED" | "QUOTA_EXCEEDED";
  usage: MembershipUsage;
  isPremium: boolean;
}

export async function checkSimulateAccess(
  userId: string,
): Promise<SimulateAccessResult> {
  const status = await getMembershipStatus(userId);
  if (status.is_premium) {
    return {
      allowed: true,
      isPremium: true,
      usage: status.usage,
    };
  }

  const { simulateUsed, simulateLimit } = status.usage;
  if (simulateLimit !== null && simulateUsed >= simulateLimit) {
    return {
      allowed: false,
      reason: "QUOTA_EXCEEDED",
      isPremium: false,
      usage: status.usage,
    };
  }

  return {
    allowed: true,
    isPremium: false,
    usage: status.usage,
  };
}

export async function recordSimulateUsage(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const user = await getOrCreateUser(userId);
  const tier = resolveTier(user);

  if (tier === "premium") return;

  const month = currentMonthKey();
  const count =
    user.simulate_usage_month === month
      ? (user.simulate_usage_count ?? 0) + 1
      : 1;

  const { error } = await supabase
    .from("users")
    .update({
      simulate_usage_month: month,
      simulate_usage_count: count,
    })
    .eq("id", userId);

  if (error) {
    console.error("[recordSimulateUsage] error:", error);
  }
}

export async function activatePremium(
  userId: string,
  billingCycle: BillingCycle = "monthly",
): Promise<MembershipStatus> {
  const supabase = createAdminClient();
  await getOrCreateUser(userId);

  const now = new Date();
  const premiumUntil =
    billingCycle === "annual"
      ? addYears(now, 1).toISOString()
      : addMonths(now, 1).toISOString();

  const { data, error } = await supabase
    .from("users")
    .update({
      is_premium: true,
      plan_tier: "premium",
      billing_cycle: billingCycle,
      premium_since: now.toISOString(),
      premium_until: premiumUntil,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error("DB_ERROR");
  return buildMembershipStatus(data as AppUser);
}

export async function cancelPremium(userId: string): Promise<MembershipStatus> {
  const supabase = createAdminClient();
  await getOrCreateUser(userId);

  const { data, error } = await supabase
    .from("users")
    .update({
      is_premium: false,
      plan_tier: "free",
      billing_cycle: null,
      premium_until: null,
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error("DB_ERROR");
  return buildMembershipStatus(data as AppUser);
}
