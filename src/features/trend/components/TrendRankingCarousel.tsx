"use client";

import { motion } from "framer-motion";
import {
  Eye,
  Flame,
  ScanFace,
  Sparkles,
  TrendingUp,
  Wind,
} from "lucide-react";
import type {
  TrendRankingData,
  TrendSimOption,
  TrendTopQuestion,
} from "@/features/trend/types/trend.types";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  eye: Eye,
  nose: ScanFace,
  breast: Sparkles,
  skin: Wind,
  jaw: ScanFace,
  lifting: TrendingUp,
} as const;

interface TrendRankingCarouselProps {
  rankings: TrendRankingData;
}

export function TrendRankingCarousel({ rankings }: TrendRankingCarouselProps) {
  const slides = [
    {
      id: "questions",
      title: "오늘 가장 많이 물어본 질문",
      badge: "TOP 3",
      content: <TopQuestionsWidget items={rankings.top_questions} />,
    },
    {
      id: "simulations",
      title: "이번 주 시뮬레이션 인기",
      badge: "Weekly",
      content: <SimOptionsWidget items={rankings.popular_simulations} />,
    },
  ];

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted">
            Trend Lounge
          </p>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
            트렌드 라운지
          </h1>
        </div>
        <span className="flex items-center gap-1 text-[10px] text-muted">
          <Flame className="h-3 w-3 text-mint-dark" />
          Live
        </span>
      </div>

      <div
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ scrollPaddingLeft: "1rem" }}
      >
        {slides.map((slide, i) => (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="w-[min(88vw,340px)] shrink-0 snap-start"
          >
            <div className="rounded-3xl border border-border/80 bg-surface p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  {slide.title}
                </p>
                <span className="rounded-full bg-foreground/[0.04] px-2.5 py-0.5 text-[10px] font-semibold text-muted">
                  {slide.badge}
                </span>
              </div>
              {slide.content}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function TopQuestionsWidget({ items }: { items: TrendTopQuestion[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const Icon = ICON_MAP[item.icon] ?? Sparkles;
        return (
          <li key={item.rank} className="flex items-center gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-foreground/[0.05] text-xs font-bold text-foreground">
              {item.rank}
            </span>
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 truncate text-[13px] font-medium text-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} />
                  {item.label}
                </span>
                <span className="shrink-0 text-[10px] text-muted">
                  {item.count.toLocaleString()}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percent}%` }}
                  transition={{ duration: 0.8, delay: item.rank * 0.1 }}
                  className="h-full rounded-full bg-foreground/80"
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function SimOptionsWidget({ items }: { items: TrendSimOption[] }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.label}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[13px] font-medium text-foreground">
              {item.label}
            </span>
            <TrendBadge trend={item.trend} />
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-border/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.percent}%` }}
              transition={{ duration: 0.8 }}
              className={cn(
                "h-full rounded-full",
                item.trend === "new" ? "bg-mint-dark/70" : "bg-foreground/70",
              )}
            />
          </div>
          <p className="mt-1 text-right text-[10px] tabular-nums text-muted">
            {item.percent}%
          </p>
        </li>
      ))}
    </ul>
  );
}

function TrendBadge({ trend }: { trend: TrendSimOption["trend"] }) {
  if (trend === "up") {
    return (
      <span className="text-[10px] font-medium text-mint-dark">↑ 급상승</span>
    );
  }
  if (trend === "new") {
    return (
      <span className="rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-medium text-mint-dark">
        NEW
      </span>
    );
  }
  return <span className="text-[10px] text-muted">유지</span>;
}
