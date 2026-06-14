"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ImageIcon, Loader2, Megaphone, Save, Video } from "lucide-react";
import { toast } from "sonner";
import { useAdminKey } from "@/features/admin/store/adminAuthStore";
import type {
  AdMediaType,
  AdPlacement,
  AdPlacementId,
} from "@/features/ads/types/ad.types";
import { ADMIN_HEADER } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";

export function AdsManager() {
  const adminKey = useAdminKey();
  const [placements, setPlacements] = useState<AdPlacement[]>([]);
  const [drafts, setDrafts] = useState<Record<string, AdPlacement>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const headers = {
    [ADMIN_HEADER]: adminKey,
    "Content-Type": "application/json",
  };

  const fetchPlacements = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/ads", {
        headers: { [ADMIN_HEADER]: adminKey },
      });
      if (res.status === 401) {
        toast.error("관리자 인증 실패");
        return;
      }
      const data = await res.json();
      const list = (data.placements ?? []) as AdPlacement[];
      setPlacements(list);
      setDrafts(Object.fromEntries(list.map((p) => [p.id, { ...p }])));
    } catch {
      toast.error("광고 슬롯을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [adminKey]);

  useEffect(() => {
    void fetchPlacements();
  }, [fetchPlacements]);

  const updateDraft = (id: AdPlacementId, patch: Partial<AdPlacement>) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSave = async (id: AdPlacementId) => {
    const draft = drafts[id];
    if (!draft) return;

    if (draft.is_enabled && !draft.media_url?.trim()) {
      toast.error("ON 상태에서는 미디어 URL을 입력해 주세요.");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          id,
          is_enabled: draft.is_enabled,
          media_type: draft.media_type,
          media_url: draft.media_url,
          click_url: draft.click_url,
          alt_text: draft.alt_text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("저장 실패", { description: data.error });
        return;
      }
      toast.success(`${draft.label} 저장됨`);
      setPlacements((prev) =>
        prev.map((p) => (p.id === id ? (data.placement as AdPlacement) : p)),
      );
      setDrafts((prev) => ({
        ...prev,
        [id]: data.placement as AdPlacement,
      }));
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-mint/20 bg-mint/5 p-4 text-[12px] leading-relaxed text-muted">
        <p className="font-medium text-foreground">앱 내 광고 슬롯</p>
        <p className="mt-1">
          각 위치별 <strong className="text-foreground">ON/OFF</strong>와 미디어 URL을
          설정합니다. OFF이거나 미디어가 없으면 앱에서 해당 영역이{" "}
          <strong className="text-foreground">완전히 숨겨져</strong> 레이아웃 공백 없이
          표시됩니다.
        </p>
      </div>

      {placements.map((placement) => {
        const draft = drafts[placement.id] ?? placement;
        const isSaving = savingId === placement.id;

        return (
          <section
            key={placement.id}
            className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {placement.label}
                </h2>
                <p className="text-[11px] text-muted">{placement.description}</p>
                <code className="mt-0.5 text-[10px] text-muted">{placement.id}</code>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.is_enabled}
                onClick={() =>
                  updateDraft(placement.id, { is_enabled: !draft.is_enabled })
                }
                className={cn(
                  "relative h-7 w-12 shrink-0 rounded-full transition-colors",
                  draft.is_enabled ? "bg-mint" : "bg-border",
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform",
                    draft.is_enabled ? "left-[22px]" : "left-0.5",
                  )}
                />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex gap-2">
                {(["image", "video"] as AdMediaType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => updateDraft(placement.id, { media_type: type })}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 rounded-xl border py-2 text-xs font-medium transition",
                      draft.media_type === type
                        ? "border-mint/40 bg-mint/5 text-mint-dark"
                        : "border-border text-muted hover:border-border/80",
                    )}
                  >
                    {type === "image" ? (
                      <ImageIcon className="h-3.5 w-3.5" />
                    ) : (
                      <Video className="h-3.5 w-3.5" />
                    )}
                    {type === "image" ? "이미지" : "동영상"}
                  </button>
                ))}
              </div>

              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  미디어 URL *
                </span>
                <input
                  type="url"
                  value={draft.media_url ?? ""}
                  onChange={(e) =>
                    updateDraft(placement.id, { media_url: e.target.value })
                  }
                  placeholder="https://... (jpg, png, mp4)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  클릭 URL (선택)
                </span>
                <input
                  type="url"
                  value={draft.click_url ?? ""}
                  onChange={(e) =>
                    updateDraft(placement.id, { click_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-[11px] font-medium text-muted">
                  대체 텍스트 (접근성)
                </span>
                <input
                  type="text"
                  value={draft.alt_text ?? ""}
                  onChange={(e) =>
                    updateDraft(placement.id, { alt_text: e.target.value })
                  }
                  placeholder="광고 설명"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
                />
              </label>

              {draft.media_url && draft.media_type === "image" && (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={draft.media_url}
                    alt="미리보기"
                    className="max-h-36 w-full object-cover"
                  />
                </div>
              )}

              {draft.media_url && draft.media_type === "video" && (
                <video
                  src={draft.media_url}
                  className="max-h-36 w-full rounded-xl border border-border/60 object-cover"
                  muted
                  controls
                  playsInline
                />
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => void handleSave(placement.id)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-white transition hover:bg-foreground/90 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                저장
              </button>
            </div>
          </section>
        );
      })}

      <p className="text-center text-[11px] text-muted">
        <Link href="/admin" className="text-mint-dark hover:underline">
          ← 관리자 홈
        </Link>
      </p>
    </div>
  );
}
