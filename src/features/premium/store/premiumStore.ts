"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BillingCycle } from "@/features/premium/constants/plans";
import type { MembershipStatus } from "@/features/premium/types/premium.types";
import { getPatientId } from "@/features/leads/store/leadModalStore";

const DEFAULT_USAGE: MembershipStatus["usage"] = {
  simulateUsed: 0,
  simulateLimit: 1,
  simulateMonth: "",
};

interface PremiumState {
  membership: MembershipStatus | null;
  isLoading: boolean;
  isPremium: boolean;
  setLoading: (value: boolean) => void;
  refreshStatus: () => Promise<void>;
  subscribe: (billingCycle?: BillingCycle) => Promise<boolean>;
  cancel: () => Promise<boolean>;
}

function deriveIsPremium(m: MembershipStatus | null): boolean {
  return Boolean(m?.is_premium);
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set) => ({
      membership: null,
      isLoading: false,
      isPremium: false,
      setLoading: (value) => set({ isLoading: value }),

      refreshStatus: async () => {
        const patientId = getPatientId();
        set({ isLoading: true });
        try {
          const res = await fetch(
            `/api/premium/status?user_id=${encodeURIComponent(patientId)}`,
          );
          if (!res.ok) return;
          const data = (await res.json()) as MembershipStatus;
          set({ membership: data, isPremium: deriveIsPremium(data) });
        } catch {
          /* keep cached */
        } finally {
          set({ isLoading: false });
        }
      },

      subscribe: async (billingCycle: BillingCycle = "monthly") => {
        const patientId = getPatientId();
        set({ isLoading: true });
        try {
          const res = await fetch("/api/premium/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              user_id: patientId,
              billing_cycle: billingCycle,
            }),
          });
          if (!res.ok) return false;
          const data = await res.json();
          const membership: MembershipStatus = {
            user_id: data.user_id,
            plan_tier: data.plan_tier,
            is_premium: data.is_premium,
            billing_cycle: data.billing_cycle,
            premium_since: data.premium_since,
            premium_until: data.premium_until,
            usage: data.usage ?? DEFAULT_USAGE,
          };
          set({ membership, isPremium: deriveIsPremium(membership) });
          return true;
        } catch {
          return false;
        } finally {
          set({ isLoading: false });
        }
      },

      cancel: async () => {
        const patientId = getPatientId();
        set({ isLoading: true });
        try {
          const res = await fetch("/api/premium/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: patientId }),
          });
          if (!res.ok) return false;
          const data = (await res.json()) as MembershipStatus;
          set({
            membership: {
              user_id: data.user_id,
              plan_tier: data.plan_tier,
              is_premium: data.is_premium,
              billing_cycle: data.billing_cycle,
              premium_since: data.premium_since,
              premium_until: data.premium_until,
              usage: data.usage ?? DEFAULT_USAGE,
            },
            isPremium: false,
          });
          return true;
        } catch {
          return false;
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: "prefit-premium",
      partialize: (s) => ({
        membership: s.membership,
        isPremium: s.isPremium,
      }),
    },
  ),
);

export function useMembershipUsage() {
  return usePremiumStore((s) => s.membership?.usage ?? DEFAULT_USAGE);
}
