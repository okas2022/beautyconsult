import { NextRequest, NextResponse } from "next/server";
import { getMembershipStatus } from "@/lib/users/user-service";

export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("user_id")?.trim();

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  try {
    const membership = await getMembershipStatus(userId);
    return NextResponse.json(membership);
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
