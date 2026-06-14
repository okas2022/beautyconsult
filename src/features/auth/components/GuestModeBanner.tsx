"use client";

import Link from "next/link";
import { useAuthStore } from "@/features/auth/store/authStore";
import { GUEST_CHAT_LIMIT } from "@/features/auth/types/auth.types";

export function GuestModeBanner() {
  const member = useAuthStore((s) => s.member);
  const mode = useAuthStore((s) => s.mode);

  if (mode !== "guest" || !member?.is_guest) return null;

  const chatsLeft = Math.max(0, GUEST_CHAT_LIMIT - (member.guest_chat_count ?? 0));

  return (
    <div className="border-b border-mint/20 bg-mint/5 px-4 py-2.5 text-center text-[11px] leading-relaxed text-muted">
      <span className="text-foreground">둘러보기 중</span>
      {chatsLeft > 0
        ? ` · AI 상담 ${chatsLeft}회 체험 가능`
        : " · AI 상담 체험 완료"}
      {" · "}
      <Link href="/signup" className="font-medium text-mint-dark underline-offset-2 hover:underline">
        회원가입
      </Link>
      {" "}후 전체 기능 이용
    </div>
  );
}
