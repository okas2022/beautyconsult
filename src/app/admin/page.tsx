"use client";

import { Suspense } from "react";
import Link from "next/link";
import {
  Building2,
  CreditCard,
  Handshake,
  Megaphone,
  Play,
  Users,
} from "lucide-react";
import { useAdminTenant } from "@/features/admin/hooks/useAdminTenant";

function AdminDashboardContent() {
  const tenant = useAdminTenant();
  const q = `?hospital=${tenant.slug}`;

  const cards = [
    {
      href: `/admin/subscription${q}`,
      icon: CreditCard,
      title: "유튜브 답변 Pro 구독",
      description: "병원별 유튜브 답변 데이터 · AI 상담 (B2B SaaS)",
    },
    {
      href: `/admin/videos${q}`,
      icon: Play,
      title: "유튜브 답변 관리",
      description: "유튜브 링크 업로드 · 답변 데이터 등록",
    },
    {
      href: `/admin/leads${q}`,
      icon: Users,
      title: "Lead 관리",
      description: "상담 예약 리드 · 상태 변경",
    },
    {
      href: `/admin/ads`,
      icon: Megaphone,
      title: "앱 내 광고",
      description: "슬롯별 ON/OFF · 이미지·동영상 배너",
    },
    {
      href: `/admin/partnerships${q}`,
      icon: Handshake,
      title: "파트너십",
      description: "CPA/CPL · 병원 네트워크",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mb-8 flex items-center gap-2">
        <Building2 className="h-6 w-6 text-mint-dark" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">병원 관리자</h1>
          <p className="text-sm text-muted">
            Tenant: <span className="font-medium text-foreground">{tenant.name}</span>{" "}
            ({tenant.slug})
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ href, icon: Icon, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:border-mint/30 hover:shadow-md"
          >
            <Icon className="mb-3 h-5 w-5 text-mint-dark" />
            <h2 className="font-semibold text-foreground group-hover:text-mint-dark">
              {title}
            </h2>
            <p className="mt-1 text-xs text-muted">{description}</p>
          </Link>
        ))}
      </div>

      <p className="mt-8 text-center text-[11px] text-muted">
        테넌트 URL 예:{" "}
        <code className="rounded bg-border/50 px-1">/chat?hospital={tenant.slug}</code>
      </p>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardContent />
    </Suspense>
  );
}
