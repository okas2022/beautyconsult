import { create } from "zustand";
import type { ChatMessage } from "@/features/chat/types/chat.types";

interface ChatState {
  messages: ChatMessage[];
  isTyping: boolean;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  setIsTyping: (typing: boolean) => void;
}

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "안녕하세요, PreFit AI 실장입니다. 피부·성형 고민을 편하게 말씀해 주세요. 검증된 전문의 유튜브 자료만을 근거로 답변드립니다.",
    timestamp: new Date(Date.now() - 120000),
  },
  {
    id: "2",
    role: "user",
    content: "쌍꺼풀 수술 후 부종이 오래 가는 편인데, 정상 범위인가요?",
    timestamp: new Date(Date.now() - 90000),
  },
  {
    id: "3",
    role: "assistant",
    content:
      "수술 후 2~4주간 부종은 흔한 경과입니다. 다만 한쪽만 심하거나 통증·발열이 동반되면 내원이 필요합니다. 아래 영상에서 전문의가 회복 타임라인을 설명하고 있습니다.",
    timestamp: new Date(Date.now() - 60000),
    youtubeRef: {
      id: "yt-1",
      title: "쌍꺼풀 수술 후 부종, 언제까지 정상일까? | 성형외과 전문의 Q&A",
      channelName: "Dr. Kim Plastic Surgery",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      duration: "12:34",
    },
  },
];

export const useChatStore = create<ChatState>((set) => ({
  messages: MOCK_MESSAGES,
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
}));
