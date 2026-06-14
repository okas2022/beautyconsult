"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store/authStore";

export function LoginPage() {
  const router = useRouter();
  const setMember = useAuthStore((s) => s.setMember);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          full_name: fullName,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMember(data.member, "member");
      toast.success(`${data.member.full_name}님, 환영합니다.`);
      router.push("/trend");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-10 pb-24">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← 앱 소개
      </Link>
      <h1 className="mt-6 text-xl font-semibold text-foreground">로그인</h1>
      <p className="mt-1 text-sm text-muted">
        가입 시 설정한 이름과 비밀번호로 로그인합니다.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted">
            이름 *
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="홍길동"
            autoComplete="username"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            required
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted">
            비밀번호 *
          </span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="8자 이상"
            autoComplete="current-password"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            required
            minLength={8}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          로그인
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        아직 회원이 아니신가요?{" "}
        <Link href="/signup" className="font-medium text-mint-dark hover:underline">
          회원가입
        </Link>
      </p>
    </div>
  );
}
