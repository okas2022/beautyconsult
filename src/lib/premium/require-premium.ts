import { NextResponse } from "next/server";
import {
  checkSimulateAccess,
  isUserPremium,
} from "@/lib/users/user-service";

export const PREMIUM_REQUIRED_CODE = "PREMIUM_REQUIRED";
export const QUOTA_EXCEEDED_CODE = "QUOTA_EXCEEDED";

export function premiumRequiredResponse() {
  return NextResponse.json(
    {
      error: "프리미엄 멤버십이 필요합니다.",
      code: PREMIUM_REQUIRED_CODE,
    },
    { status: 403 },
  );
}

export function quotaExceededResponse(usage: {
  simulateUsed: number;
  simulateLimit: number | null;
}) {
  return NextResponse.json(
    {
      error: `이번 달 무료 시뮬레이션 ${usage.simulateLimit}회를 모두 사용했습니다. Premium으로 무제한 이용하세요.`,
      code: QUOTA_EXCEEDED_CODE,
      usage,
    },
    { status: 403 },
  );
}

/** 프리미엄 전용 API (피부 리포트 등) */
export async function requirePremiumUser(
  userId: string | null | undefined,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  if (!userId?.trim()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "user_id is required", code: PREMIUM_REQUIRED_CODE },
        { status: 400 },
      ),
    };
  }

  const premium = await isUserPremium(userId.trim());
  if (!premium) {
    return { ok: false, response: premiumRequiredResponse() };
  }

  return { ok: true };
}

/** 가상 성형 — Premium 무제한 / Free 월 1회 */
export async function requireSimulateAccess(
  userId: string | null | undefined,
): Promise<
  | { ok: true; isPremium: boolean }
  | { ok: false; response: NextResponse }
> {
  if (!userId?.trim()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "user_id is required", code: PREMIUM_REQUIRED_CODE },
        { status: 400 },
      ),
    };
  }

  const access = await checkSimulateAccess(userId.trim());
  if (!access.allowed) {
    if (access.reason === "QUOTA_EXCEEDED") {
      return {
        ok: false,
        response: quotaExceededResponse(access.usage),
      };
    }
    return { ok: false, response: premiumRequiredResponse() };
  }

  return { ok: true, isPremium: access.isPremium };
}
