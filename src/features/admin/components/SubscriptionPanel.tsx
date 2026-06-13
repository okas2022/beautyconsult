"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAdminTenant } from "@/features/admin/hooks/useAdminTenant";
import type { Hospital } from "@/features/hospitals/types/hospital.types";
import { HOSPITAL_CATALOG } from "@/features/hospitals/constants/hospitals";
import { ADMIN_HEADER } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

interface SubscriptionPanelProps {
  adminKey: string;
}

export function SubscriptionPanel({ adminKey }: SubscriptionPanelProps) {
  const tenant = useAdminTenant();
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const headers = {
    [ADMIN_HEADER]: adminKey,
    "Content-Type": "application/json",
  };

  const fetchStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/subscription?hospital_id=${tenant.hospitalId}`,
        { headers: { [ADMIN_HEADER]: adminKey } },
      );
      if (res.status === 401) {
        toast.error("관리자 인증 실패");
        return;
      }
      const data = await res.json();
      setHospital(data.hospital ?? null);
    } catch {
      toast.error("구독 정보를 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [adminKey, tenant.hospitalId]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  const handleSubscribe = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/admin/subscription", {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "activate",
          hospital_id: tenant.hospitalId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("구독 실패", { description: data.error });
        return;
      }
      setHospital(data.hospital);
      toast.success(data.message ?? "구독이 활성화되었습니다.");
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">RAG Pro 구독</h1>
        <p className="mt-1 text-sm text-muted">
          병원별 유튜브 RAG 검색 · AI 상담 데이터 격리 (B2B SaaS)
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-surface p-4">
        <label className="mb-2 block text-xs font-medium text-muted">
          관리 중인 병원 (Tenant)
        </label>
        <select
          value={tenant.slug}
          onChange={(e) => {
            const slug = e.target.value;
            window.location.href = `/admin/subscription?hospital=${slug}`;
          }}
          className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm"
        >
          {HOSPITAL_CATALOG.map((h) => (
            <option key={h.id} value={h.slug}>
              {h.name} ({h.slug})
            </option>
          ))}
        </select>
        <p className="mt-2 text-[11px] text-muted">
          서브도메인 · URL 파라미터로도 식별 가능:{" "}
          <code className="rounded bg-border/50 px-1">?hospital={tenant.slug}</code>
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div
            className={cn(
              "rounded-2xl border p-6",
              hospital?.is_subscribed
                ? "border-mint/40 bg-mint/5"
                : "border-border bg-surface",
            )}
          >
            <div className="mb-4 flex items-center gap-2">
              <ShieldCheck
                className={cn(
                  "h-5 w-5",
                  hospital?.is_subscribed ? "text-mint-dark" : "text-muted",
                )}
              />
              <span className="font-semibold">{hospital?.name ?? tenant.name}</span>
            </div>
            <p className="text-sm text-muted">
              {hospital?.is_subscribed
                ? "✓ RAG Pro 구독 활성 — 해당 병원 유튜브 DB만 AI 검색"
                : "구독 전 — RAG 검색 비활성, 영상 등록 불가"}
            </p>
            <ul className="mt-4 space-y-1.5 text-xs text-muted">
              <li>· 병원별 hospital_videos 격리</li>
              <li>· /api/chat RAG 필터 (tenant ID)</li>
              <li>· 무제한 유튜브 링크 등록</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-2 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-foreground" />
              <span className="font-semibold">RAG Pro</span>
            </div>
            <p className="text-2xl font-bold">
              ₩990,000
              <span className="text-sm font-normal text-muted"> /월</span>
            </p>
            <p className="mt-2 text-xs text-muted">
              PoC: 실제 결제 연동 전 시뮬레이션 버튼으로 구독 활성화
            </p>
            {!hospital?.is_subscribed ? (
              <button
                type="button"
                onClick={() => void handleSubscribe()}
                disabled={isProcessing}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CreditCard className="h-4 w-4" />
                )}
                구독 결제 (PoC)
              </button>
            ) : (
              <Link
                href={`/admin/videos?hospital=${tenant.slug}`}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-mint/40 bg-mint/10 py-3 text-sm font-semibold text-mint-dark"
              >
                유튜브 영상 등록하기 →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
