"use client";

import { useEffect } from "react";
import { usePremiumStore } from "@/features/premium/store/premiumStore";

export function PremiumBootstrap() {
  const refreshStatus = usePremiumStore((s) => s.refreshStatus);

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  return null;
}
