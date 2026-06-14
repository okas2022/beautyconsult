"use client";

import { create } from "zustand";
import type { AdPlacement, AdPlacementId } from "@/features/ads/types/ad.types";

interface AdState {
  placements: AdPlacement[];
  loaded: boolean;
  refreshAds: () => Promise<void>;
  getPlacement: (id: AdPlacementId) => AdPlacement | undefined;
}

export const useAdStore = create<AdState>((set, get) => ({
  placements: [],
  loaded: false,

  refreshAds: async () => {
    try {
      const res = await fetch("/api/ads");
      const data = await res.json();
      set({
        placements: (data.placements ?? []) as AdPlacement[],
        loaded: true,
      });
    } catch {
      set({ loaded: true });
    }
  },

  getPlacement: (id) => get().placements.find((p) => p.id === id),
}));
