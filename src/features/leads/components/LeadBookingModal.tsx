"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, Loader2, Phone, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { useChatStore } from "@/features/chat/store/chatStore";
import {
  getPatientId,
  useLeadModalStore,
} from "@/features/leads/store/leadModalStore";
import { cn } from "@/lib/utils";

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export function LeadBookingModal() {
  const isOpen = useLeadModalStore((s) => s.isOpen);
  const context = useLeadModalStore((s) => s.context);
  const close = useLeadModalStore((s) => s.close);
  const getHistoryForApi = useChatStore((s) => s.getHistoryForApi);

  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) setPhone("");
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      toast.error("전화번호를 정확히 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: digits,
          patient_id: getPatientId(),
          hospital_id: context?.hospitalId,
          video_id: context?.videoId,
          video_title: context?.videoTitle,
          messages: getHistoryForApi(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error("신청 실패", { description: data.error ?? "다시 시도해 주세요." });
        return;
      }

      toast.success("상담 신청이 접수되었습니다!", {
        description: "병원에서 곧 연락드릴 예정입니다.",
      });
      close();
    } catch {
      toast.error("네트워크 오류", { description: "잠시 후 다시 시도해 주세요." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={close}
          />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-[101] mx-auto max-w-lg"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck className="h-5 w-5 text-mint-dark" />
                  <h2 className="text-base font-semibold text-foreground">
                    원장님 상담 예약
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full p-1 text-muted hover:bg-muted/10 hover:text-foreground"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="p-5">
                {context?.videoTitle && (
                  <p className="mb-4 rounded-xl bg-mint/5 px-3 py-2 text-xs text-muted">
                    관심 영상:{" "}
                    <span className="font-medium text-foreground">
                      {context.videoTitle}
                    </span>
                  </p>
                )}

                <p className="mb-4 text-sm leading-relaxed text-muted">
                  AI 상담 내용을 바탕으로 병원에서 연락드립니다.
                  연락받을 전화번호를 입력해 주세요.
                </p>

                <label className="mb-5 block">
                  <span className="mb-2 flex items-center gap-1.5 text-xs font-medium text-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    휴대폰 번호
                  </span>
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="010-0000-0000"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    disabled={isSubmitting}
                    className={cn(
                      "w-full rounded-xl border border-border bg-background px-4 py-3",
                      "text-base text-foreground placeholder:text-muted/50",
                      "focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20",
                    )}
                  />
                </label>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isSubmitting || phone.replace(/\D/g, "").length < 10}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI 요약 생성 중...
                    </>
                  ) : (
                    "예약 / 상담 신청하기"
                  )}
                </Button>

                <p className="mt-3 text-center text-[10px] text-muted/70">
                  입력하신 정보는 상담 목적으로만 사용됩니다.
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
