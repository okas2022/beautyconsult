"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  LEAD_STATUS_LABELS,
  type Lead,
  type LeadStatus,
} from "@/features/leads/types/lead.types";
import { ADMIN_HEADER } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

interface LeadsTableProps {
  adminKey: string;
}

export function LeadsTable({ adminKey }: LeadsTableProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/leads", {
        headers: { [ADMIN_HEADER]: adminKey },
      });
      if (res.status === 401) {
        toast.error("관리자 인증 실패");
        return;
      }
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      toast.error("리드 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    void fetchLeads();
  }, [fetchLeads]);

  const updateStatus = async (id: string, status: LeadStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          [ADMIN_HEADER]: adminKey,
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("update failed");
      const data = await res.json();
      setLeads((prev) =>
        prev.map((l) => (l.id === id ? (data.lead as Lead) : l)),
      );
      toast.success(`상태 변경: ${LEAD_STATUS_LABELS[status]}`);
    } catch {
      toast.error("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-xl bg-border/60" />
        ))}
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted">접수된 상담 신청이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-sm font-medium text-foreground">
          총 {leads.length}건
        </p>
        <button
          type="button"
          onClick={() => void fetchLeads()}
          className="flex items-center gap-1 text-xs text-muted hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          새로고침
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-background/80 text-xs text-muted">
              <th className="px-4 py-3 font-medium">접수일</th>
              <th className="px-4 py-3 font-medium">전화번호</th>
              <th className="px-4 py-3 font-medium">상담 요약</th>
              <th className="px-4 py-3 font-medium">관심 영상</th>
              <th className="px-4 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-border/60 last:border-0 hover:bg-background/40"
              >
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted">
                  {new Date(lead.created_at).toLocaleString("ko-KR", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium">
                  {formatPhoneDisplay(lead.phone_number)}
                </td>
                <td className="max-w-xs px-4 py-3">
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted">
                    {lead.consultation_summary ?? "-"}
                  </p>
                </td>
                <td className="max-w-[140px] px-4 py-3">
                  <p className="line-clamp-2 text-xs text-muted">
                    {lead.video_title ?? "-"}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={lead.status}
                    disabled={updatingId === lead.id}
                    onChange={(e) =>
                      void updateStatus(lead.id, e.target.value as LeadStatus)
                    }
                    className={cn(
                      "rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-medium",
                      "focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20",
                      lead.status === "visited" && "text-mint-dark",
                      lead.status === "contacted" && "text-foreground",
                      lead.status === "pending" && "text-muted",
                    )}
                  >
                    {(Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map(
                      (s) => (
                        <option key={s} value={s}>
                          {LEAD_STATUS_LABELS[s]}
                        </option>
                      ),
                    )}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11) {
    return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
  }
  return phone;
}
