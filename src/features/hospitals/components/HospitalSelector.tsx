"use client";

import { Building2 } from "lucide-react";
import {
  HOSPITAL_CATALOG,
  type HospitalCatalogEntry,
} from "@/features/hospitals/constants/hospitals";
import { useHospitalStore } from "@/features/hospitals/store/hospitalStore";
import { cn } from "@/lib/utils";

interface HospitalSelectorProps {
  className?: string;
  compact?: boolean;
}

export function HospitalSelector({ className, compact }: HospitalSelectorProps) {
  const selectedId = useHospitalStore((s) => s.selectedHospitalId);
  const setHospitalId = useHospitalStore((s) => s.setHospitalId);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {!compact && (
        <div className="flex items-center gap-1.5 px-1">
          <Building2 className="h-3.5 w-3.5 text-mint-dark" />
          <span className="text-[11px] font-medium text-muted">
            상담 병원 선택 — 해당 병원 유튜브만 추천
          </span>
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {HOSPITAL_CATALOG.map((hospital) => (
          <HospitalChip
            key={hospital.id}
            hospital={hospital}
            selected={selectedId === hospital.id}
            onSelect={() => setHospitalId(hospital.id)}
          />
        ))}
      </div>
    </div>
  );
}

function HospitalChip({
  hospital,
  selected,
  onSelect,
}: {
  hospital: HospitalCatalogEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "min-w-[7.5rem] shrink-0 rounded-xl border px-3 py-2 text-left transition active:scale-[0.98]",
        selected
          ? "border-mint/50 bg-mint/10 shadow-sm"
          : "border-border bg-surface hover:border-mint/30",
      )}
    >
      <p
        className={cn(
          "text-xs font-semibold",
          selected ? "text-mint-dark" : "text-foreground",
        )}
      >
        {hospital.name}
      </p>
      <p className="mt-0.5 text-[10px] text-muted">{hospital.youtubeHandle}</p>
    </button>
  );
}
