"use client";

import { motion } from "framer-motion";
import { Avatar } from "@/components/ui/Avatar";
import { MessageContent } from "@/features/chat/components/MessageContent";
import { YouTubeCard } from "@/features/chat/components/YouTubeCard";
import type { ChatMessage } from "@/features/chat/types/chat.types";
import { cn } from "@/lib/utils";

interface ChatMessageBubbleProps {
  message: ChatMessage;
  index: number;
  onQuickAction?: (action: string) => void;
}

export function ChatMessageBubble({
  message,
  index,
  onQuickAction,
}: ChatMessageBubbleProps) {
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
          <MessageContent content={message.content} />
        </div>

        {message.videoRefs && message.videoRefs.length > 0 && (
          <div className="w-full max-w-sm space-y-2">
            {message.videoRefs.map((ref) => (
              <YouTubeCard
                key={`${ref.video_id}-${ref.start_seconds}`}
                reference={ref}
              />
            ))}
          </div>
        )}

        {message.nextActions && message.nextActions.length > 0 && !isUser && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {message.nextActions.map((action) => (
              <button
                key={action}
                type="button"
                onClick={() => onQuickAction?.(action)}
                className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-medium text-muted transition-colors hover:border-mint/40 hover:text-mint-dark"
              >
                {action}
              </button>
            ))}
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
