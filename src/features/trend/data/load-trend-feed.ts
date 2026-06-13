import type { TrendFeedData, TrendFeedItem } from "@/features/trend/types/trend.types";
import feedItems from "../../../../data/trend/trend-feed.json";
import rankings from "../../../../data/trend/trend-rankings.json";

const RANKINGS = rankings as TrendFeedData["rankings"];

export function loadTrendFeedData(): TrendFeedData {
  return {
    updated_at: new Date().toISOString(),
    rankings: RANKINGS,
    feed: feedItems as TrendFeedItem[],
  };
}

export function getTrendFeedItems(): TrendFeedItem[] {
  return feedItems as TrendFeedItem[];
}
