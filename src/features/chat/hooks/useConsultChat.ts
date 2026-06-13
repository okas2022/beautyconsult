"use client";

import { useCallback } from "react";
import { useChatStore } from "@/features/chat/store/chatStore";
import type { ChatApiResponse } from "@/features/chat/types/chat.types";
import { DEFAULT_HOSPITAL_ID } from "@/features/leads/types/lead.types";

export function useConsultChat() {
  const addMessage = useChatStore((s) => s.addMessage);
  const setIsTyping = useChatStore((s) => s.setIsTyping);
  const getHistoryForApi = useChatStore((s) => s.getHistoryForApi);
  const isTyping = useChatStore((s) => s.isTyping);

  const sendMessage = useCallback(
    async (userText: string) => {
      const trimmed = userText.trim();
      if (!trimmed || isTyping) return false;

      addMessage({ role: "user", content: trimmed });
      setIsTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history: getHistoryForApi().slice(0, -1),
            hospital_id: DEFAULT_HOSPITAL_ID,
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
        return true;
      } catch {
        addMessage({
          role: "assistant",
          content:
            "일시적인 오류가 발생했습니다. 잠시 후 다시 질문해 주시면, 원장님 대본 자료를 바탕으로 답변드리겠습니다.",
        });
        return false;
      } finally {
        setIsTyping(false);
      }
    },
    [addMessage, getHistoryForApi, isTyping, setIsTyping],
  );

  return { sendMessage, isTyping };
}
