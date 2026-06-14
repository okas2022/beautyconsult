"use client";

import { create } from "zustand";

export interface LeadBookingContext {
  videoId?: string;
  videoTitle?: string;
  hospitalId?: string;
}

interface LeadModalState {
  isOpen: boolean;
  context: LeadBookingContext | null;
  open: (context?: LeadBookingContext) => void;
  close: () => void;
}

export const useLeadModalStore = create<LeadModalState>((set) => ({
  isOpen: false,
  context: null,
  open: (context) => set({ isOpen: true, context: context ?? null }),
  close: () => set({ isOpen: false, context: null }),
}));

const PATIENT_ID_KEY = "prefit_patient_id";

export function getPatientId(): string {
  if (typeof window === "undefined") return "anonymous";

  try {
    const raw = localStorage.getItem("prefit-auth");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { member?: { id?: string } } };
      const memberId = parsed?.state?.member?.id;
      if (memberId) return memberId;
    }
  } catch {
    /* ignore */
  }

  let id = localStorage.getItem(PATIENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(PATIENT_ID_KEY, id);
  }
  return id;
}
