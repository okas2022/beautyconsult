"use client";

import { create } from "zustand";

interface HospitalProfileState {
  isDetailOpen: boolean;
  detailHospitalId: string | null;
  openDetail: (hospitalId: string) => void;
  closeDetail: () => void;
}

export const useHospitalProfileStore = create<HospitalProfileState>((set) => ({
  isDetailOpen: false,
  detailHospitalId: null,
  openDetail: (hospitalId) =>
    set({ isDetailOpen: true, detailHospitalId: hospitalId }),
  closeDetail: () => set({ isDetailOpen: false, detailHospitalId: null }),
}));
