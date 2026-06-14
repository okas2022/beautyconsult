"use client";

import { TrendQACard } from "@/features/trend/components/TrendQACard";
import { TrendRankingCarousel } from "@/features/trend/components/TrendRankingCarousel";
import { AdSlot } from "@/features/ads/components/AdSlot";
import { loadTrendFeedData } from "@/features/trend/data/load-trend-feed";

export function TrendLounge() {
  const data = loadTrendFeedData();

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-5">
      <TrendRankingCarousel rankings={data.rankings} />

      <AdSlot placementId="trend_feed_top" className="mb-4" />

      <section>
        <div className="mb-4 px-1">
          <h2 className="text-sm font-semibold text-foreground">
            실시간 AI 상담 피드
          </h2>
          <p className="mt-0.5 text-[11px] text-muted">
            익명으로 공유된 상담 — 같은 고민, 검증된 답변
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {data.feed.map((item, i) => (
            <TrendQACard key={item.id} item={item} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
