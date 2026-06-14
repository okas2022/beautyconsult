import { NextRequest, NextResponse } from "next/server";
import type { LoginPayload, SignupPayload } from "@/features/auth/types/auth.types";
import {
  createGuestMember,
  getMemberById,
  incrementGuestChatCount,
  loginMember,
  signupMember,
} from "@/lib/members/member-service";

export async function GET(request: NextRequest) {
  const memberId = request.nextUrl.searchParams.get("member_id")?.trim();
  if (!memberId) {
    return NextResponse.json({ member: null });
  }

  try {
    const member = await getMemberById(memberId);
    return NextResponse.json({ member });
  } catch {
    return NextResponse.json({ member: null });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const action = typeof body?.action === "string" ? body.action : "";

  try {
    if (action === "signup") {
      const payload = body as SignupPayload & { member_id?: string };
      const member = await signupMember(
        {
          full_name: payload.full_name ?? "",
          birth_yymmdd: payload.birth_yymmdd ?? "",
          birth_gender_digit: payload.birth_gender_digit ?? "",
          road_address: payload.road_address ?? "",
          road_address_detail: payload.road_address_detail,
          zip_code: payload.zip_code,
          phone_number: payload.phone_number ?? "",
          usage_purpose: payload.usage_purpose ?? "",
          password: payload.password ?? "",
        },
        typeof payload.member_id === "string" ? payload.member_id : undefined,
      );
      return NextResponse.json({ member });
    }

    if (action === "login") {
      const payload = body as LoginPayload;
      const member = await loginMember({
        full_name: payload.full_name ?? "",
        password: payload.password ?? "",
      });
      return NextResponse.json({ member });
    }

    if (action === "guest") {
      const member = await createGuestMember();
      return NextResponse.json({ member });
    }

    if (action === "guest_chat") {
      const memberId = typeof body?.member_id === "string" ? body.member_id : "";
      if (!memberId) {
        return NextResponse.json({ error: "member_id required" }, { status: 400 });
      }
      const count = await incrementGuestChatCount(memberId);
      const member = await getMemberById(memberId);
      return NextResponse.json({ member, guest_chat_count: count });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";
    if (code === "PHONE_EXISTS") {
      return NextResponse.json(
        { error: "이미 가입된 휴대폰 번호입니다. 로그인해 주세요." },
        { status: 409 },
      );
    }
    if (code === "NOT_FOUND") {
      return NextResponse.json(
        { error: "이름 또는 비밀번호가 올바르지 않습니다." },
        { status: 404 },
      );
    }
    if (
      code !== "DB_ERROR" &&
      error instanceof Error &&
      error.message.length > 0 &&
      !["PHONE_EXISTS", "NOT_FOUND"].includes(code)
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[api/auth]", error);
    return NextResponse.json(
      {
        error:
          "처리 중 오류가 발생했습니다. member_profiles 테이블 마이그레이션을 확인해 주세요.",
      },
      { status: 500 },
    );
  }
}
