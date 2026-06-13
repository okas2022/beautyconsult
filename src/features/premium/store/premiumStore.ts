"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getPatientId } from "@/features/leads/store/leadModalStore";

interface PremiumState {
  isPremium: boolean;
  isLoading: boolean;
  setPremium: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  refreshStatus: () => Promise<void>;
  subscribe: () => Promise<boolean>;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      isPremium: false,
      isLoading: false,
      setPremium: (value) => set({ isPremium: value }),
      setLoading: (value) => set({ isLoading: value }),

      refreshStatus: async () => {
        const patientId = getPatientId();
        set({ isLoading: true });
        try {
          const res = await fetch(
            `/api/premium/status?user_id=${encodeURIComponent(patientId)}`,
          );
          const data = await res.json();
          set({ isPremium: Boolean(data.is_premium) });
        } catch {
          /* keep cached */
        } finally {
          set({ isLoading: false });
        }
      },

      subscribe: async () => {
        const patientId = getPatientId();
        set({ isLoading: true });
        try {
          const res = await fetch("/api/premium/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: patientId }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          set({ isPremium: Boolean(data.is_premium) });
          return true;
        } catch {
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    { name: "prefit-premium", partialize: (s) => ({ isPremium: s.isPremium }) },
  ),
);
