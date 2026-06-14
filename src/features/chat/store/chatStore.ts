import { create } from "zustand";
import type { ChatSendBlockReason } from "@/features/chat/types/chat-send.types";
import type { ChatMessage } from "@/features/chat/types/chat.types";

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  signupBlockReason: ChatSendBlockReason | null;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  setIsTyping: (typing: boolean) => void;
  setSignupBlockReason: (reason: ChatSendBlockReason | null) => void;
  getHistoryForApi: () => Array<{ role: "user" | "assistant"; content: string }>;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "안녕하세요, PreFit AI 실장입니다. 상단에서 병원을 선택하면 위치·홈페이지·원장 프로필을 확인할 수 있어요. 피부·성형 고민을 편하게 말씀해 주시면, 해당 병원 유튜브 답변과 영상 구간을 함께 안내해 드립니다.",
  timestamp: new Date(),
  nextActions: ["병원 정보 자세히"],
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [WELCOME_MESSAGE],
  isTyping: false,
  signupBlockReason: null,
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
  setSignupBlockReason: (reason) => set({ signupBlockReason: reason }),
  getHistoryForApi: () =>
    get()
      .messages.filter((m) => m.id !== "welcome")
      .slice(-6)
      .map((m) => ({
        role: m.role,
        content: m.content,
      })),
}));
