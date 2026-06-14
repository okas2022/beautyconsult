import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const MEDICAL_DISCLAIMER_TEXT =
  "PreFit AI의 답변은 참고용 의학 정보이며, 정확한 진단은 전문의와 상담하시기 바랍니다.";

interface MedicalDisclaimerProps {
  variant?: "bar" | "inline";
  className?: string;
}

/** AI 상담 — 면책 조항 고정 노출 */
export function MedicalDisclaimer({
  variant = "bar",
  className,
}: MedicalDisclaimerProps) {
  if (variant === "inline") {
    return (
      <p
        className={cn(
          "flex items-start gap-1.5 text-[10px] leading-relaxed text-muted",
          className,
        )}
        role="note"
      >
        <AlertCircle
          className="mt-0.5 h-3 w-3 shrink-0 text-muted/70"
          strokeWidth={2}
          aria-hidden
        />
        {MEDICAL_DISCLAIMER_TEXT}
      </p>
    );
  }

  return (
    <div
      className={cn(
        "flex items-start gap-2 border-t border-border/60 bg-background/95 px-4 py-2",
        className,
      )}
      role="note"
      aria-label="의학 정보 면책 조항"
    >
      <AlertCircle
        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted"
        strokeWidth={2}
        aria-hidden
      />
      <p className="text-[10px] leading-relaxed text-muted">
        {MEDICAL_DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
