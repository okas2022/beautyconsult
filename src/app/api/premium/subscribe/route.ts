import { NextRequest, NextResponse } from "next/server";
import type { BillingCycle } from "@/features/premium/constants/plans";
import { activatePremium } from "@/lib/users/user-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId =
      typeof body?.user_id === "string" ? body.user_id.trim() : "";
    const billingCycleRaw = body?.billing_cycle;
    const billingCycle: BillingCycle =
      billingCycleRaw === "annual" ? "annual" : "monthly";

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const membership = await activatePremium(userId, billingCycle);

    return NextResponse.json({
      success: true,
      user_id: membership.user_id,
      is_premium: membership.is_premium,
      plan_tier: membership.plan_tier,
      billing_cycle: billingCycle,
      premium_since: membership.premium_since,
      premium_until: membership.premium_until,
      usage: membership.usage,
      message:
        "구독이 활성화되었습니다. (베타: 실제 결제 없이 이용 가능)",
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
