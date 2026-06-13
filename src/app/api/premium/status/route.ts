import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/users/user-service";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id")?.trim();

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const user = await getOrCreateUser(userId);
    return NextResponse.json({
      user_id: user.id,
      is_premium: user.is_premium,
      premium_since: user.premium_since,
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
