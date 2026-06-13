"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Play, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdminTenant } from "@/features/admin/hooks/useAdminTenant";
import { useAdminKey } from "@/features/admin/store/adminAuthStore";
import type { Hospital, HospitalVideo } from "@/features/hospitals/types/hospital.types";
import { HOSPITAL_CATALOG } from "@/features/hospitals/constants/hospitals";
import { ADMIN_HEADER } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

export function VideosManager() {
  const adminKey = useAdminKey();
  const tenant = useAdminTenant();
  const hospitalId = tenant.hospitalId;
  const [hospital, setHospital] = useState<Hospital | null>(null);
  const [videos, setVideos] = useState<HospitalVideo[]>([]);
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const headers = {
    [ADMIN_HEADER]: adminKey,
    "Content-Type": "application/json",
  };

  const fetchVideos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin/videos?hospital_id=${hospitalId}`,
        { headers: { [ADMIN_HEADER]: adminKey } },
      );
      if (res.status === 401) {
        toast.error("관리자 인증 실패");
        return;
      }
      const data = await res.json();
      setHospital(data.hospital ?? null);
      setVideos(data.videos ?? []);
    } catch {
      toast.error("영상 목록을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [adminKey, hospitalId]);

  useEffect(() => {
    void fetchVideos();
  }, [fetchVideos]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsAdding(true);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: url.trim(),
          hospital_id: hospitalId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("등록 실패", { description: data.error });
        return;
      }
      toast.success("유튜브 영상이 RAG에 등록되었습니다.");
      setUrl("");
      void fetchVideos();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "DELETE",
        headers,
        body: JSON.stringify({ id, hospital_id: hospitalId }),
      });
      if (!res.ok) throw new Error("delete failed");
      toast.success("영상이 삭제되었습니다.");
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } catch {
      toast.error("삭제에 실패했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">유튜브 RAG 관리</h1>
          <p className="mt-1 text-sm text-muted">
            B2B 구독 병원 전용 — 등록된 영상만 AI 상담 RAG에 포함됩니다
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Link
            href={`/admin?hospital=${tenant.slug}`}
            className="rounded-full border border-border px-3 py-1.5 text-muted hover:text-foreground"
          >
            ← 대시보드
          </Link>
          <Link
            href={`/admin/leads?hospital=${tenant.slug}`}
            className="rounded-full border border-border px-3 py-1.5 text-muted hover:text-foreground"
          >
            Lead 관리 →
          </Link>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-surface px-4 py-3">
        <label className="mb-2 block text-xs font-medium text-muted">병원 (Tenant)</label>
        <select
          value={tenant.slug}
          onChange={(e) => {
            window.location.href = `/admin/videos?hospital=${e.target.value}`;
          }}
          className="w-full rounded-xl border border-border bg-background px-4 py-2 text-sm"
        >
          {HOSPITAL_CATALOG.map((h) => (
            <option key={h.id} value={h.slug}>
              {h.name}
            </option>
          ))}
        </select>
      </div>

      <div
        className={cn(
          "mb-6 rounded-2xl border px-4 py-3 text-sm",
          hospital?.is_subscribed
            ? "border-mint/30 bg-mint/5 text-mint-dark"
            : "border-amber-200 bg-amber-50 text-amber-800",
        )}
      >
        {hospital ? (
          <>
            <span className="font-semibold">{hospital.name}</span>
            {" · "}
            {hospital.is_subscribed ? "✓ RAG 구독 활성" : "⚠ 구독 비활성 — 영상 등록 불가"}
          </>
        ) : (
          "병원 정보를 불러오는 중..."
        )}
      </div>

      <form
        onSubmit={(e) => void handleAdd(e)}
        className="mb-8 rounded-2xl border border-border bg-surface p-4 shadow-sm"
      >
        <label className="mb-2 block text-xs font-medium text-foreground">
          유튜브 링크 추가
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            disabled={isAdding || !hospital?.is_subscribed}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isAdding || !url.trim() || !hospital?.is_subscribed}
            className="inline-flex items-center gap-1.5 rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            추가
          </button>
        </div>
        <p className="mt-2 text-[11px] text-muted">
          자막 추출 후 hospital_videos 테이블에 저장 · AI 채팅 RAG 검색 대상
        </p>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-border/60" />
          ))}
        </div>
      ) : !videos.length ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <Play className="mx-auto mb-3 h-8 w-8 text-muted/40" />
          <p className="text-sm text-muted">등록된 유튜브 영상이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((video) => (
            <div
              key={video.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                <Play className="h-5 w-5 text-red-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground line-clamp-1">
                  {video.title ?? video.video_id}
                </p>
                <p className="mt-0.5 text-xs text-muted">{video.url}</p>
                <p className="mt-1 text-[11px] text-mint-dark">
                  자막 {video.transcripts.length}개 세그먼트
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleDelete(video.id)}
                disabled={deletingId === video.id}
                className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                aria-label="삭제"
              >
                {deletingId === video.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
