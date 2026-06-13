"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import { ChatInput } from "@/features/chat/components/ChatInput";
import { ChatMessageBubble } from "@/features/chat/components/ChatMessage";
import { useChatStore } from "@/features/chat/store/chatStore";

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
      <span className="text-xs text-muted">AI 실장이 답변을 준비하고 있습니다...</span>
    </motion.div>
  );
}

export function ChatInterface() {
  const messages = useChatStore((s) => s.messages);
  const isTyping = useChatStore((s) => s.isTyping);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="flex h-full flex-col">
      {/* Trust badge */}
      <div className="flex shrink-0 items-center justify-center gap-1.5 border-b border-border/60 bg-mint/5 px-4 py-2">
        <ShieldCheck className="h-3.5 w-3.5 text-mint-dark" strokeWidth={2} />
        <p className="text-[11px] text-muted">
          <span className="font-medium text-mint-dark">검증된 전문의</span> 유튜브
          데이터만을 근거로 답변합니다
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain px-4 py-5"
      >
        <div className="mx-auto flex max-w-lg flex-col gap-5">
          {messages.map((msg, i) => (
            <ChatMessageBubble key={msg.id} message={msg} index={i} />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0">
        <ChatInput />
      </div>
    </div>
  );
}
