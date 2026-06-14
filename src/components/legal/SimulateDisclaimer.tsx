import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const SIMULATE_DISCLAIMER_TEXT =
  "본 이미지는 AI 가상 시뮬레이션으로 실제 수술 결과와 다를 수 있습니다.";

interface SimulateDisclaimerProps {
  className?: string;
}

export function SimulateDisclaimer({ className }: SimulateDisclaimerProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 dark:border-amber-900/40 dark:bg-amber-950/20",
        className,
      )}
      role="note"
      aria-label="가상 시뮬레이션 면책 조항"
    >
      <AlertTriangle
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600"
        strokeWidth={2}
        aria-hidden
      />
      <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-200/90">
        {SIMULATE_DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
