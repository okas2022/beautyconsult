"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  HOSPITAL_CATALOG,
  WITH_HOSPITAL_ID,
  type HospitalCatalogEntry,
  type HospitalCategory,
} from "@/features/hospitals/constants/hospitals";

type CategoryFilter = "all" | HospitalCategory;

interface HospitalState {
  selectedHospitalId: string;
  categoryFilter: CategoryFilter;
  setHospitalId: (id: string) => void;
  setCategoryFilter: (filter: CategoryFilter) => void;
  getSelectedHospital: () => HospitalCatalogEntry;
}

export const useHospitalStore = create<HospitalState>()(
  persist(
    (set, get) => ({
      selectedHospitalId: WITH_HOSPITAL_ID,
      categoryFilter: "all",
      setHospitalId: (id) => set({ selectedHospitalId: id }),
      setCategoryFilter: (filter) => set({ categoryFilter: filter }),
      getSelectedHospital: () => {
        const id = get().selectedHospitalId;
        return HOSPITAL_CATALOG.find((h) => h.id === id) ?? HOSPITAL_CATALOG[0];
      },
    }),
    {
      name: "prefit-hospital",
      partialize: (s) => ({
        selectedHospitalId: s.selectedHospitalId,
        categoryFilter: s.categoryFilter,
      }),
    },
  ),
);
