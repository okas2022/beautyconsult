"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Send, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useChatStore } from "@/features/chat/store/chatStore";
import { cn } from "@/lib/utils";

export function ChatInput() {
  const [input, setInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const addMessage = useChatStore((s) => s.addMessage);
  const setIsTyping = useChatStore((s) => s.setIsTyping);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && !preview) return;

    addMessage({
      role: "user",
      content: trimmed || "사진을 첨부했습니다.",
    });

    setInput("");
    setPreview(null);
    setIsTyping(true);

    // Mock AI response — will be replaced with RAG pipeline
    setTimeout(() => {
      setIsTyping(false);
      addMessage({
        role: "assistant",
        content:
          "말씀해 주신 내용을 검토 중입니다. 관련 전문의 영상을 찾아 근거와 함께 답변드리겠습니다.",
      });
    }, 1500);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    e.target.value = "";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border bg-surface/80 backdrop-blur-xl">
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden px-4 pt-3"
          >
            <div className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="업로드 미리보기"
                className="h-20 w-20 rounded-xl object-cover ring-1 ring-border"
              />
              <button
                onClick={() => setPreview(null)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-white shadow-sm"
                aria-label="이미지 제거"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        <Button
          variant="icon"
          size="sm"
          onClick={() => fileRef.current?.click()}
          aria-label="사진 업로드"
          className="mb-0.5 shrink-0"
        >
          <ImagePlus className="h-5 w-5" strokeWidth={1.75} />
        </Button>

        <div className="relative flex-1">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="피부·성형 고민을 입력하세요..."
            rows={1}
            className={cn(
              "w-full resize-none rounded-2xl border border-border bg-background px-4 py-2.5",
              "text-[15px] leading-snug text-foreground placeholder:text-muted/60",
              "focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20",
              "max-h-32 transition-all duration-200",
            )}
            style={{
              minHeight: "42px",
              fieldSizing: "content" as never,
            }}
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={!input.trim() && !preview}
          aria-label="메시지 전송"
          className="mb-0.5 shrink-0"
        >
          <Send className="h-4 w-4" strokeWidth={1.75} />
        </Button>
      </div>
    </div>
  );
}
