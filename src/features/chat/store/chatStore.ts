import { create } from "zustand";
import type { ChatMessage } from "@/features/chat/types/chat.types";

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  setIsTyping: (typing: boolean) => void;
  getHistoryForApi: () => Array<{ role: "user" | "assistant"; content: string }>;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "안녕하세요, PreFit AI 실장입니다. 피부·성형 고민을 편하게 말씀해 주세요. 검증된 전문의 유튜브 자료를 검색해, 해당 구간 영상과 함께 답변드립니다.",
  timestamp: new Date(),
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),
  setIsTyping: (typing) => set({ isTyping: typing }),
  getHistoryForApi: () =>
    get()
      .messages.filter((m) => m.id !== "welcome")
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
      })),
}));
