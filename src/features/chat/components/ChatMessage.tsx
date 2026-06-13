"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { YouTubeCard } from "@/features/chat/components/YouTubeCard";
import type { ChatMessage } from "@/features/chat/types/chat.types";
import { cn } from "@/lib/utils";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  index: number;
}

export function ChatMessageBubble({ message, index }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className={cn(
        "flex gap-2.5",
        isUser ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar role={message.role} />

      <div
        className={cn(
          "flex max-w-[82%] flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        {!isUser && (
          <span className="mb-1 px-1 text-[11px] font-medium text-mint-dark">
            AI 실장
          </span>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
            isUser
              ? "rounded-tr-md bg-foreground text-white"
              : "rounded-tl-md bg-surface border border-border text-foreground shadow-sm",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.youtubeRef && (
          <div className="w-full max-w-sm">
            <YouTubeCard reference={message.youtubeRef} />
          </div>
        )}

        <time className="mt-1 px-1 text-[10px] text-muted">
          {message.timestamp.toLocaleTimeString("ko-KR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </motion.div>
  );
}
