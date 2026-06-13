"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { CalendarCheck, Clock, ExternalLink, Play } from "lucide-react";
import type { YoutubeVideoRef } from "@/features/chat/types/chat.types";
import { useLeadModalStore } from "@/features/leads/store/leadModalStore";
import { cn } from "@/lib/utils";

interface YouTubeCardProps {
  reference: YoutubeVideoRef;
  className?: string;
  showBookingButton?: boolean;
}

export function YouTubeCard({
  reference,
  className,
  showBookingButton = true,
}: YouTubeCardProps) {
  const openLeadModal = useLeadModalStore((s) => s.open);
  const isShort = reference.content_type === "short";
  const thumbnailUrl = `https://img.youtube.com/vi/${reference.video_id}/hqdefault.jpg`;

  const handlePlay = () => {
    window.open(reference.deep_link, "_blank", "noopener,noreferrer");
  };

  const handleBooking = (e: React.MouseEvent) => {
    e.stopPropagation();
    openLeadModal({
      videoId: reference.video_id,
      videoTitle: reference.title,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "mt-3 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={handlePlay}
        className="group block w-full text-left"
      >
        <div className="relative aspect-video w-full overflow-hidden bg-muted/10">
          <Image
            src={thumbnailUrl}
            alt={reference.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 400px"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
              <Play className="ml-0.5 h-4 w-4 fill-foreground text-foreground" />
            </div>
          </div>
          <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            <Clock className="h-2.5 w-2.5" />
            {reference.timestamp}
          </span>
          {isShort && (
            <span className="absolute left-2 top-2 rounded-md bg-mint/90 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              Shorts
            </span>
          )}
        </div>

        <div className="p-3.5 pb-2">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
              YouTube
            </span>
            <span className="text-[11px] text-muted">검증된 전문의</span>
          </div>
          <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
            {reference.title}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-mint-dark">
            <span>{reference.timestamp}부터 재생</span>
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </button>

      {showBookingButton && (
        <div className="border-t border-border/60 px-3.5 py-3">
          <button
            type="button"
            onClick={handleBooking}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground py-2.5 text-xs font-semibold text-white transition hover:bg-foreground/90 active:scale-[0.98]"
          >
            <CalendarCheck className="h-4 w-4" />
            이 원장님께 바로 예약/상담 신청하기
          </button>
        </div>
      )}
    </motion.div>
  );
}
