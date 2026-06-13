"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AdminAuthState {
  adminKey: string;
  isAuthenticated: boolean;
  login: (key: string) => void;
  logout: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      adminKey: "",
      isAuthenticated: false,
      login: (key) => {
        const trimmed = key.trim();
        if (!trimmed) return;
        set({ adminKey: trimmed, isAuthenticated: true });
      },
      logout: () => set({ adminKey: "", isAuthenticated: false }),
    }),
    {
      name: "prefit-admin-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        adminKey: s.adminKey,
        isAuthenticated: s.isAuthenticated,
      }),
    },
  ),
);

export function useAdminKey(): string {
  return useAdminAuthStore((s) => s.adminKey);
}
