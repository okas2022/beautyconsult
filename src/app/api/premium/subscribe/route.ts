import { NextRequest, NextResponse } from "next/server";
import { activatePremium } from "@/lib/users/user-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId =
      typeof body?.user_id === "string" ? body.user_id.trim() : "";

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const user = await activatePremium(userId);

    return NextResponse.json({
      success: true,
      user_id: user.id,
      is_premium: user.is_premium,
      premium_since: user.premium_since,
      message: "데모 결제가 완료되었습니다.",
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
