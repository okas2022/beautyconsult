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
  const [phone, setPhone] = useState("");
  const [birthYymmdd, setBirthYymmdd] = useState("");
  const [birthGenderDigit, setBirthGenderDigit] = useState("");
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
          phone_number: phone,
          birth_yymmdd: birthYymmdd,
          birth_gender_digit: birthGenderDigit,
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
    <div className="mx-auto max-w-lg px-5 py-10">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← 앱 소개
      </Link>
      <h1 className="mt-6 text-xl font-semibold text-foreground">로그인</h1>
      <p className="mt-1 text-sm text-muted">
        가입 시 등록한 휴대폰 번호와 생년월일로 로그인합니다.
      </p>

      <form onSubmit={(e) => void handleSubmit(e)} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted">
            휴대폰 번호 *
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01012345678"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
            required
          />
        </label>

        <div>
          <span className="mb-1 block text-[11px] font-medium text-muted">
            생년월일 · 주민번호 앞 6자리 + 뒷자리 첫 번째 *
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={birthYymmdd}
              onChange={(e) =>
                setBirthYymmdd(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="YYMMDD"
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
              required
            />
            <span className="text-muted">-</span>
            <input
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={birthGenderDigit}
              onChange={(e) =>
                setBirthGenderDigit(e.target.value.replace(/\D/g, "").slice(0, 1))
              }
              placeholder="●"
              className="w-14 rounded-xl border border-border bg-background px-3 py-2.5 text-center text-sm"
              required
            />
            <span className="text-sm text-muted">●●●●●●</span>
          </div>
        </div>

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
