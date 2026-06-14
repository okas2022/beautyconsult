"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AddressSearch } from "@/features/auth/components/AddressSearch";
import { useAuthStore } from "@/features/auth/store/authStore";
import {
  USAGE_PURPOSE_OPTIONS,
  type JusoAddressItem,
} from "@/features/auth/types/auth.types";
import { getPatientId } from "@/features/leads/store/leadModalStore";

export function SignupPage() {
  const router = useRouter();
  const setMember = useAuthStore((s) => s.setMember);
  const [fullName, setFullName] = useState("");
  const [birthYymmdd, setBirthYymmdd] = useState("");
  const [birthGenderDigit, setBirthGenderDigit] = useState("");
  const [address, setAddress] = useState<JusoAddressItem | null>(null);
  const [addressDetail, setAddressDetail] = useState("");
  const [phone, setPhone] = useState("");
  const [usagePurpose, setUsagePurpose] = useState(USAGE_PURPOSE_OPTIONS[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address?.roadAddr) {
      toast.error("도로명 주소를 검색해 선택해 주세요.");
      return;
    }

    setLoading(true);
    try {
      const memberId =
        typeof window !== "undefined" ? getPatientId() : undefined;
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "signup",
          member_id: memberId !== "anonymous" ? memberId : undefined,
          full_name: fullName,
          birth_yymmdd: birthYymmdd,
          birth_gender_digit: birthGenderDigit,
          road_address: address.roadAddr,
          road_address_detail: addressDetail,
          zip_code: address.zipNo,
          phone_number: phone,
          usage_purpose: usagePurpose,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMember(data.member, "member");
      toast.success("회원가입이 완료되었습니다.");
      router.push("/trend");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-10 pb-16">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        ← 앱 소개
      </Link>
      <h1 className="mt-6 text-xl font-semibold text-foreground">회원가입</h1>
      <p className="mt-1 text-sm text-muted">
        PreFit 서비스 이용을 위해 정보를 입력해 주세요.
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
              className="w-14 rounded-xl border border-border bg-background px-3 py-2.5 text-center text-sm"
              required
            />
            <span className="text-sm text-muted">●●●●●●</span>
          </div>
          <p className="mt-1 text-[10px] text-muted">
            뒷자리 전체는 저장하지 않으며, 본인 확인용 첫 자리만 받습니다.
          </p>
        </div>

        <AddressSearch value={address} onSelect={setAddress} />

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted">
            상세 주소 (동·호수)
          </span>
          <input
            type="text"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            placeholder="101동 1001호"
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          />
        </label>

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

        <label className="block">
          <span className="mb-1 block text-[11px] font-medium text-muted">
            사용 목적 *
          </span>
          <select
            value={usagePurpose}
            onChange={(e) => setUsagePurpose(e.target.value as typeof usagePurpose)}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
          >
            {USAGE_PURPOSE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-foreground text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          가입 완료
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-medium text-mint-dark hover:underline">
          로그인
        </Link>
      </p>
    </div>
  );
}
