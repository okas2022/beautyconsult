"use client";

import { useCallback } from "react";
import { useAuthStore } from "@/features/auth/store/authStore";
import { GUEST_CHAT_LIMIT } from "@/features/auth/types/auth.types";
import { useChatStore } from "@/features/chat/store/chatStore";
import type { ChatApiResponse } from "@/features/chat/types/chat.types";
import type {
  ChatSendBlockReason,
  ChatSendResult,
} from "@/features/chat/types/chat-send.types";
import { useHospitalStore } from "@/features/hospitals/store/hospitalStore";

export type { ChatSendBlockReason, ChatSendResult };

export function useConsultChat() {
  const addMessage = useChatStore((s) => s.addMessage);
  const setIsTyping = useChatStore((s) => s.setIsTyping);
  const getHistoryForApi = useChatStore((s) => s.getHistoryForApi);
  const isTyping = useChatStore((s) => s.isTyping);
  const blockReason = useChatStore((s) => s.signupBlockReason);
  const setSignupBlockReason = useChatStore((s) => s.setSignupBlockReason);
  const hospitalId = useHospitalStore((s) => s.selectedHospitalId);
  const mode = useAuthStore((s) => s.mode);
  const member = useAuthStore((s) => s.member);
  const setMember = useAuthStore((s) => s.setMember);

  const clearBlockReason = useCallback(
    () => setSignupBlockReason(null),
    [setSignupBlockReason],
  );

  const sendMessage = useCallback(
    async (userText: string): Promise<ChatSendResult> => {
      const trimmed = userText.trim();
      if (!trimmed || isTyping) return { ok: false, reason: "auth_required" };

      if (mode === "none") {
        setSignupBlockReason("auth_required");
        return { ok: false, reason: "auth_required" };
      }

      if (
        mode === "guest" &&
        member?.is_guest &&
        (member.guest_chat_count ?? 0) >= GUEST_CHAT_LIMIT
      ) {
        setSignupBlockReason("guest_limit");
        return { ok: false, reason: "guest_limit" };
      }

      addMessage({ role: "user", content: trimmed });
      setIsTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: getHistoryForApi().slice(0, -1),
            hospital_id: hospitalId,
          }),
        });

        const data = (await res.json()) as ChatApiResponse;

        if (!res.ok && !data.reply) {
          throw new Error(data.error ?? "request failed");
        }

        addMessage({
          role: "assistant",
          content: data.reply,
          videoRefs: data.videoRefs,
          symptomKeywords: data.symptomKeywords,
          products: data.products,
          nextActions: data.nextActions,
        });

        if (mode === "guest" && member?.id) {
          const incRes = await fetch("/api/auth", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "guest_chat",
              member_id: member.id,
            }),
          });
          const incData = (await incRes.json()) as { member?: typeof member };
          if (incData.member) {
            setMember(incData.member, "guest");
          }
        }

        return { ok: true };
      } catch {
        addMessage({
          role: "assistant",
          content:
            "일시적인 오류가 발생했습니다. 잠시 후 다시 질문해 주시면, 유튜브 답변을 바탕으로 안내드리겠습니다.",
        });
        return { ok: false, reason: "auth_required" };
      } finally {
        setIsTyping(false);
      }
    },
    [
      addMessage,
      getHistoryForApi,
      hospitalId,
      isTyping,
      member,
      mode,
      setIsTyping,
      setMember,
      setSignupBlockReason,
    ],
  );

  return { sendMessage, isTyping, blockReason, clearBlockReason };
}
