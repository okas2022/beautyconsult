"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  HOSPITAL_CATALOG,
  WITH_HOSPITAL_ID,
  type HospitalCatalogEntry,
} from "@/features/hospitals/constants/hospitals";

interface HospitalState {
  selectedHospitalId: string;
  setHospitalId: (id: string) => void;
  getSelectedHospital: () => HospitalCatalogEntry;
}

export const useHospitalStore = create<HospitalState>()(
  persist(
    (set, get) => ({
      selectedHospitalId: WITH_HOSPITAL_ID,
      setHospitalId: (id) => set({ selectedHospitalId: id }),
      getSelectedHospital: () => {
        const id = get().selectedHospitalId;
        return (
          HOSPITAL_CATALOG.find((h) => h.id === id) ??
          HOSPITAL_CATALOG[0]
        );
      },
    }),
    { name: "prefit-hospital", partialize: (s) => ({ selectedHospitalId: s.selectedHospitalId }) },
  ),
);
