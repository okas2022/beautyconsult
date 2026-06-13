"use client";

// framer-motion: Apple-style subtle entrance animations for chat bubbles
import { motion } from "framer-motion";
import Image from "next/image";
import { ExternalLink, Play } from "lucide-react";
import type { YouTubeReference } from "@/features/chat/types/chat.types";
import { cn } from "@/lib/utils";

interface YouTubeCardProps {
  reference: YouTubeReference;
  className?: string;
}

export function YouTubeCard({ reference, className }: YouTubeCardProps) {
  return (
    <motion.a
      href={reference.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        "group mt-3 block overflow-hidden rounded-2xl border border-border bg-surface",
        "shadow-sm transition-shadow duration-300 hover:shadow-md",
        className,
      )}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted/10">
        <Image
          src={reference.thumbnailUrl}
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
        {reference.duration && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {reference.duration}
          </span>
        )}
      </div>

      <div className="p-3.5">
        <div className="mb-1 flex items-center gap-1.5">
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-500">
            YouTube
          </span>
          <span className="text-[11px] text-muted">{reference.channelName}</span>
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
          {reference.title}
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-mint-dark opacity-0 transition-opacity group-hover:opacity-100">
          <span>영상 보기</span>
          <ExternalLink className="h-3 w-3" />
        </div>
      </div>
    </motion.a>
  );
}
