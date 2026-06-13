import { NextResponse } from "next/server";
import { isUserPremium } from "@/lib/users/user-service";

export const PREMIUM_REQUIRED_CODE = "PREMIUM_REQUIRED";

export function premiumRequiredResponse() {
  return NextResponse.json(
    {
      error: "프리미엄 멤버십이 필요합니다.",
      code: PREMIUM_REQUIRED_CODE,
    },
    { status: 403 },
  );
}

/** 프리미엄 전용 API 라우트 최상단 권한 체크 */
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
