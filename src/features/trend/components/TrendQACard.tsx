"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowUpRight, MessageCircle } from "lucide-react";
import type { TrendFeedItem } from "@/features/trend/types/trend.types";
import { useTrendHandoffStore } from "@/features/trend/store/trendHandoffStore";
import { VideoAdBadge } from "@/components/ui/VideoAdBadge";
import { cn } from "@/lib/utils";

interface TrendQACardProps {
  item: TrendFeedItem;
  index: number;
}

export function TrendQACard({ item, index }: TrendQACardProps) {
  const router = useRouter();
  const setPendingPrompt = useTrendHandoffStore((s) => s.setPendingPrompt);

  const handleAskSameTopic = () => {
    setPendingPrompt(item.prompt_for_chat);
    router.push("/chat");
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="overflow-hidden rounded-3xl border border-border/70 bg-surface shadow-[0_4px_24px_rgba(0,0,0,0.03)]"
    >
      <div className="p-5 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="rounded-full bg-foreground/[0.04] px-2.5 py-1 text-[11px] font-semibold text-foreground">
            #{item.area_tag}
          </span>
          <span className="text-[10px] text-muted">
            {item.asked_ago} · 조회 {item.view_count}
          </span>
        </div>

        <h2 className="text-[15px] font-semibold leading-snug tracking-tight text-foreground">
          {item.question_summary}
        </h2>

        <p className="mt-3 text-[13px] leading-relaxed text-muted line-clamp-2">
          {item.answer_preview}
        </p>

        <div className="mt-4 flex gap-3 rounded-2xl bg-background/80 p-2.5">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-border/40">
            <Image
              src={item.youtube.thumbnail_url}
              alt=""
              fill
              className="object-cover"
              sizes="80px"
            />
            {item.youtube.is_ad && (
              <VideoAdBadge className="right-0.5 top-0.5 scale-90" />
            )}
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              관련 영상
            </p>
            <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-foreground/80">
              {item.youtube.title}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={handleAskSameTopic}
        className={cn(
          "flex w-full items-center justify-center gap-2 border-t border-border/60",
          "px-5 py-3.5 text-[13px] font-medium text-foreground",
          "transition hover:bg-foreground/[0.02] active:bg-foreground/[0.04]",
        )}
      >
        <MessageCircle className="h-4 w-4 text-mint-dark" strokeWidth={1.75} />
        내 상담방에서 이 주제로 물어보기
        <ArrowUpRight className="h-3.5 w-3.5 text-muted" />
      </button>
    </motion.article>
  );
}
