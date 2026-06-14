"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";
import { MOBILE_TAB_BAR_PADDING_CLASS } from "@/components/layout/constants";
import { MedicalDisclaimer } from "@/components/legal/MedicalDisclaimer";
import { AdSlot } from "@/features/ads/components/AdSlot";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { ChatMessageBubble } from "@/features/chat/components/ChatMessage";
import { useConsultChat } from "@/features/chat/hooks/useConsultChat";
import { useChatStore } from "@/features/chat/store/chatStore";
import { LeadBookingModal } from "@/features/leads/components/LeadBookingModal";
import { useLeadModalStore } from "@/features/leads/store/leadModalStore";
import { HospitalSelector } from "@/features/hospitals/components/HospitalSelector";
import { useHospitalStore } from "@/features/hospitals/store/hospitalStore";
import { useHospitalProfileStore } from "@/features/hospitals/store/hospitalProfileStore";
import { useTrendHandoffStore } from "@/features/trend/store/trendHandoffStore";
import { cn } from "@/lib/utils";

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="flex items-center gap-2.5 px-1"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-mint/20 to-lavender/20">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-mint"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
      <span className="text-xs text-muted">
        AI 실장이 원장님 답변을 분석 중입니다...
      </span>
    </motion.div>
  );
}

export function ChatInterface() {
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const { sendMessage } = useConsultChat();
  const openLeadModal = useLeadModalStore((s) => s.open);
  const openHospitalDetail = useHospitalProfileStore((s) => s.openDetail);
  const selectedHospital = useHospitalStore((s) => s.getSelectedHospital());
  const consumePendingPrompt = useTrendHandoffStore((s) => s.consumePendingPrompt);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handoffSent = useRef(false);

  const hasConversation = messages.filter((m) => m.id !== "welcome").length > 0;

  useEffect(() => {
    if (handoffSent.current || isTyping) return;
    const prompt = consumePendingPrompt();
    if (prompt) {
      handoffSent.current = true;
      void sendMessage(prompt);
    }
  }, [consumePendingPrompt, isTyping, sendMessage]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleQuickAction = useCallback(
    (action: string) => {
      if (action.includes("예약") || action.includes("상담")) {
        openLeadModal({ hospitalId: selectedHospital.id });
        return;
      }
      if (
        action.includes("자세히") ||
        action.includes("병원 정보") ||
        action.includes("병원 소개")
      ) {
        openHospitalDetail(selectedHospital.id);
        return;
      }
      void sendMessage(action);
    },
    [openHospitalDetail, openLeadModal, selectedHospital.id, sendMessage],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* 페이지 헤더 — 트렌드·마이페이지와 동일 톤 */}
      <div className="shrink-0 px-4 pt-5 pb-3">
        <h1 className="text-lg font-semibold tracking-tight text-foreground">
          상담하기
        </h1>
        <p className="mt-0.5 text-[11px] text-muted">
          {selectedHospital.name} · 유튜브 답변 제공 · AI 실장 상담
        </p>
      </div>

      <div className="shrink-0 border-b border-border/60 px-4 pb-3">
        <HospitalSelector compact />
      </div>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-5">
          <MedicalDisclaimer variant="inline" className="px-0.5" />
          <AdSlot placementId="chat_messages_top" />
          {messages.map((msg, i) => (
            <ChatMessageBubble
              key={msg.id}
              message={msg}
              index={i}
              onQuickAction={handleQuickAction}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </div>

      {/* 입력 영역 — 하단 탭바 위 고정 */}
      <div
        className={cn(
          "shrink-0 border-t border-border/60 bg-surface",
          MOBILE_TAB_BAR_PADDING_CLASS,
        )}
      >
        {hasConversation ? (
          <div className="px-4 py-2">
            <button
              type="button"
              onClick={() => openLeadModal({ hospitalId: selectedHospital.id })}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-mint/30 bg-mint/5 py-2 text-xs font-semibold text-mint-dark transition hover:bg-mint/10 active:scale-[0.99]"
            >
              <CalendarCheck className="h-3.5 w-3.5" />
              원장님께 예약 / 상담 신청
            </button>
          </div>
        ) : (
          <div className="px-4 py-1.5">
            <button
              type="button"
              onClick={() => openLeadModal({ hospitalId: selectedHospital.id })}
              className="flex w-full items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium text-muted transition hover:text-mint-dark"
            >
              <CalendarCheck className="h-3 w-3" />
              상담 후 병원 예약도 도와드립니다
            </button>
          </div>
        )}

        <AdSlot placementId="chat_input_above" className="px-4 pb-1" />
        <MedicalDisclaimer />
        <ChatInput />
      </div>

      <LeadBookingModal />
    </div>
  );
}
