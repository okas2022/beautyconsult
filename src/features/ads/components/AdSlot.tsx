"use client";

import { getPlacementMeta } from "@/features/ads/constants/placements";
import { useAdStore } from "@/features/ads/store/adStore";
import type { AdPlacement, AdPlacementId } from "@/features/ads/types/ad.types";
import { cn } from "@/lib/utils";

interface AdSlotProps {
  placementId: AdPlacementId;
  className?: string;
}

function AdCreative({
  placement,
  aspectRatio,
  maxHeight,
}: {
  placement: AdPlacement;
  aspectRatio: string;
  maxHeight?: number;
}) {
  const alt = placement.alt_text ?? placement.label;
  const mediaUrl = placement.media_url!;
  const isVideo = placement.media_type === "video";

  const media = (
    <div
      className="relative w-full overflow-hidden rounded-2xl bg-muted/10"
      style={{ aspectRatio, maxHeight: maxHeight ? `${maxHeight}px` : undefined }}
    >
      {isVideo ? (
        <video
          src={mediaUrl}
          className="h-full w-full object-cover"
          muted
          loop
          playsInline
          autoPlay
          aria-label={alt}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl}
          alt={alt}
          className="h-full w-full object-cover"
        />
      )}
      <span className="absolute right-2 top-2 z-10 rounded px-1 py-px text-[9px] font-bold text-white/95 bg-black/60">
        AD
      </span>
    </div>
  );

  if (placement.click_url) {
    return (
      <a
        href={placement.click_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="block transition active:scale-[0.99]"
        aria-label={`${placement.label} 광고`}
      >
        {media}
      </a>
    );
  }

  return media;
}

/** enabled + media 있는 슬롯만 렌더 — off면 null (레이아웃 공백 없음) */
export function AdSlot({ placementId, className }: AdSlotProps) {
  const placement = useAdStore((s) => s.getPlacement(placementId));

  if (!placement?.is_enabled || !placement.media_url?.trim()) {
    return null;
  }

  const meta = getPlacementMeta(placementId);

  return (
    <div className={cn("w-full", className)} data-ad-slot={placementId}>
      <AdCreative
        placement={placement}
        aspectRatio={meta.aspectRatio}
        maxHeight={meta.maxHeight}
      />
    </div>
  );
}
