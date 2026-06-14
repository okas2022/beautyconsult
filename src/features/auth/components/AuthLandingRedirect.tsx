"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";

/** 로그인 회원이 소개 화면 접근 시 앱으로 이동 */
export function AuthLandingRedirect() {
  const router = useRouter();
  const hydrated = useAuthStore((s) => s.hydrated);
  const mode = useAuthStore((s) => s.mode);

  useEffect(() => {
    if (!hydrated) return;
    if (mode === "member" || mode === "guest") {
      router.replace("/trend");
    }
  }, [hydrated, mode, router]);

  return null;
}
