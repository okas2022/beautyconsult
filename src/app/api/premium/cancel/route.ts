import { NextRequest, NextResponse } from "next/server";
import { cancelPremium } from "@/lib/users/user-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId =
      typeof body?.user_id === "string" ? body.user_id.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const membership = await cancelPremium(userId);

    return NextResponse.json({
      success: true,
      ...membership,
      message: "구독이 해지되었습니다. 현재 결제 기간 종료 후 무료 플랜으로 전환됩니다.",
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
