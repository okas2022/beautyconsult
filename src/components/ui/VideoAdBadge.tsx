import { cn } from "@/lib/utils";

interface VideoAdBadgeProps {
  className?: string;
  /** 기본 "AD" — 한국어 UI에서도 AD가 관행적 */
  label?: "AD" | "광고";
}

/** 앱 내 영상 썸네일·카드 구석 — 유료 제휴 병원 콘텐츠 표시 */
export function VideoAdBadge({ className, label = "AD" }: VideoAdBadgeProps) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-10 rounded px-1 py-px",
        "text-[9px] font-bold leading-none tracking-wide text-white/95",
        "bg-black/60 backdrop-blur-[2px]",
        className,
      )}
      aria-label="광고"
    >
      {label}
    </span>
  );
}
