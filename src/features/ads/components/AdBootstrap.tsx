"use client";

import { useEffect } from "react";
import { useAdStore } from "@/features/ads/store/adStore";

export function AdBootstrap() {
  const refreshAds = useAdStore((s) => s.refreshAds);

  useEffect(() => {
    void refreshAds();
  }, [refreshAds]);

  return null;
}
