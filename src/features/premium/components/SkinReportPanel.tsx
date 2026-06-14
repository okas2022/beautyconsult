"use client";

import { motion } from "framer-motion";
import { Download, Sparkles, X } from "lucide-react";
import type { SkinReport } from "@/features/premium/types/premium.types";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const SCORE_LABELS: Record<keyof SkinReport["scores"], string> = {
  hydration: "수분",
  barrier: "장벽",
  pigmentation: "색소",
  elasticity: "탄력",
};

interface SkinReportPanelProps {
  report: SkinReport;
  onClose?: () => void;
  className?: string;
}

export function SkinReportPanel({
  report,
  onClose,
  className,
}: SkinReportPanelProps) {
  const handleSave = () => {
    const history = JSON.parse(
      localStorage.getItem("prefit-skin-reports") ?? "[]",
    ) as SkinReport[];
    history.unshift(report);
    localStorage.setItem(
      "prefit-skin-reports",
      JSON.stringify(history.slice(0, 20)),
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "overflow-hidden rounded-3xl border border-mint/25 bg-surface shadow-lg",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-mint/5 px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-mint-dark" />
          <span className="text-sm font-semibold text-foreground">
            AI 피부 정밀 리포트
          </span>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted hover:bg-black/5"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-4 p-4">
        <p className="text-[13px] leading-relaxed text-foreground">
          {report.summary}
        </p>

        <div className="grid grid-cols-2 gap-2">
          {(
            Object.entries(report.scores) as Array<
              [keyof SkinReport["scores"], number]
            >
          ).map(([key, score]) => (
            <div
              key={key}
              className="rounded-2xl border border-border/60 bg-background/80 p-3"
            >
              <p className="text-[10px] font-medium text-muted">
                {SCORE_LABELS[key]}
              </p>
              <p className="mt-0.5 text-xl font-bold text-mint-dark">{score}</p>
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full bg-mint"
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">
            맞춤 케어 추천
          </p>
          <ul className="space-y-1.5">
            {report.recommendations.map((rec) => (
              <li
                key={rec}
                className="flex items-start gap-2 text-[12px] text-muted"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lavender" />
                {rec}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-[10px] text-muted">
          발급 {new Date(report.generated_at).toLocaleString("ko-KR")} · ID{" "}
          {report.report_id.slice(0, 8)}
        </p>

        <Button
          variant="secondary"
          size="md"
          className="w-full"
          onClick={handleSave}
        >
          <Download className="mr-2 h-4 w-4" />
          리포트 저장 (기기 내)
        </Button>
      </div>
    </motion.div>
  );
}
