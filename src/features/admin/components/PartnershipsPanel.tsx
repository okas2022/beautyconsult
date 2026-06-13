"use client";

import { useEffect, useMemo, useState } from "react";
import {
  HOSPITAL_CATALOG,
  HOSPITAL_CATEGORY_LABELS,
  type HospitalCategory,
} from "@/features/hospitals/constants/hospitals";
import type { Lead } from "@/features/leads/types/lead.types";
import { useAdminKey } from "@/features/admin/store/adminAuthStore";
import { ADMIN_HEADER } from "@/lib/admin/auth";

export function PartnershipsPanel() {
  const adminKey = useAdminKey();
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    void fetch("/api/leads", { headers: { [ADMIN_HEADER]: adminKey } })
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .catch(() => setLeads([]));
  }, [adminKey]);

  const leadCountByHospital = useMemo(() => {
    const map = new Map<string, number>();
    for (const lead of leads) {
      map.set(lead.hospital_id, (map.get(lead.hospital_id) ?? 0) + 1);
    }
    return map;
  }, [leads]);

  const byCategory = (cat: HospitalCategory) =>
    HOSPITAL_CATALOG.filter((h) => h.category === cat);

  return (
    <div className="space-y-8">
      {(["mega", "specialty", "trend"] as HospitalCategory[]).map((cat) => (
        <section key={cat}>
          <h2 className="mb-3 text-sm font-semibold text-foreground">
            {HOSPITAL_CATEGORY_LABELS[cat]}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="border-b border-border bg-background text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">병원</th>
                  <th className="px-3 py-2 font-medium">전문 분야</th>
                  <th className="px-3 py-2 font-medium">YouTube</th>
                  <th className="px-3 py-2 font-medium">제휴</th>
                  <th className="px-3 py-2 font-medium">CPA(원)</th>
                  <th className="px-3 py-2 font-medium">리드</th>
                </tr>
              </thead>
              <tbody>
                {byCategory(cat).map((h) => (
                  <tr key={h.id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {h.name}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {h.specialties.slice(0, 3).join(" · ")}
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {h.youtubeChannels[0]?.handle ??
                        h.youtubeChannels[0]?.label ??
                        "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={h.partnership.status} />
                    </td>
                    <td className="px-3 py-2.5 text-muted">
                      {h.partnership.cpaFeeKrw
                        ? h.partnership.cpaFeeKrw.toLocaleString()
                        : "협상 중"}
                    </td>
                    <td className="px-3 py-2.5 font-semibold text-mint-dark">
                      {leadCountByHospital.get(h.id) ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <p className="text-[11px] leading-relaxed text-muted">
        리드가 접수되면 병원별로 CPA/CPL 수수료를 정산합니다. 제휴 상태가
        prospect인 병원은 RAG·리퍼 데모만 제공되며, active 전환 후 실제 정산이
        시작됩니다.
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: "bg-mint/15 text-mint-dark",
    prospect: "bg-lavender/15 text-lavender",
    negotiating: "bg-amber-100 text-amber-800",
    paused: "bg-muted/20 text-muted",
  };
  const labels: Record<string, string> = {
    active: "Active",
    prospect: "Prospect",
    negotiating: "협상 중",
    paused: "Paused",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${styles[status] ?? styles.prospect}`}
    >
      {labels[status] ?? status}
    </span>
  );
}
