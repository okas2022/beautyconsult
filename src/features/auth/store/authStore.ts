import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthMode, MemberProfile } from "@/features/auth/types/auth.types";

const PATIENT_ID_KEY = "prefit_patient_id";

interface AuthState {
  mode: AuthMode;
  member: MemberProfile | null;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setMember: (member: MemberProfile, mode: AuthMode) => void;
  clearAuth: () => void;
  syncPatientId: (memberId: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      mode: "none",
      member: null,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setMember: (member, mode) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(PATIENT_ID_KEY, member.id);
        }
        set({ member, mode });
      },
      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem(PATIENT_ID_KEY);
        }
        set({ member: null, mode: "none" });
      },
      syncPatientId: (memberId) => {
        if (typeof window !== "undefined") {
          localStorage.setItem(PATIENT_ID_KEY, memberId);
        }
      },
    }),
    {
      name: "prefit-auth",
      partialize: (s) => ({ mode: s.mode, member: s.member }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.member?.id) {
          state.syncPatientId(state.member.id);
        }
      },
    },
  ),
);

export function getAuthMemberId(): string | null {
  return useAuthStore.getState().member?.id ?? null;
}

export function isMemberLoggedIn(): boolean {
  const { mode, member } = useAuthStore.getState();
  return mode === "member" && member !== null && !member.is_guest;
}

export function isGuestBrowsing(): boolean {
  const { mode, member } = useAuthStore.getState();
  return mode === "guest" && member?.is_guest === true;
}
