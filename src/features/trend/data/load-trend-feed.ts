import type { TrendFeedData, TrendFeedItem } from "@/features/trend/types/trend.types";
import { hospitalRequiresAdDisclosure } from "@/lib/hospitals/ad-disclosure";
import feedItems from "../../../../data/trend/trend-feed.json";
import rankings from "../../../../data/trend/trend-rankings.json";

const RANKINGS = rankings as TrendFeedData["rankings"];

function withAdDisclosure(item: TrendFeedItem): TrendFeedItem {
  const fromHospital = item.youtube.hospital_id
    ? hospitalRequiresAdDisclosure(item.youtube.hospital_id)
    : true;
  const isAd = item.youtube.is_ad ?? fromHospital;
  return {
    ...item,
    youtube: { ...item.youtube, is_ad: isAd },
  };
}

export function loadTrendFeedData(): TrendFeedData {
  return {
    updated_at: new Date().toISOString(),
    rankings: RANKINGS,
    feed: (feedItems as TrendFeedItem[]).map(withAdDisclosure),
  };
}

export function getTrendFeedItems(): TrendFeedItem[] {
  return (feedItems as TrendFeedItem[]).map(withAdDisclosure);
}
