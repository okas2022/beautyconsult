"use client";

import { Building2, Handshake } from "lucide-react";
import {
  HOSPITAL_CATALOG,
  HOSPITAL_CATEGORY_LABELS,
  type HospitalCatalogEntry,
  type HospitalCategory,
} from "@/features/hospitals/constants/hospitals";
import { HospitalProfileCard } from "@/features/hospitals/components/HospitalProfileCard";
import { HospitalProfileModal } from "@/features/hospitals/components/HospitalProfileModal";
import { getHospitalProfileForCatalog } from "@/features/hospitals/data/hospital-profiles";
import { useHospitalProfileStore } from "@/features/hospitals/store/hospitalProfileStore";
import { useHospitalStore } from "@/features/hospitals/store/hospitalStore";
import { cn } from "@/lib/utils";

const CATEGORY_ORDER: HospitalCategory[] = ["mega", "specialty", "trend"];

interface HospitalSelectorProps {
  className?: string;
}

export function HospitalSelector({ className }: HospitalSelectorProps) {
  const selectedId = useHospitalStore((s) => s.selectedHospitalId);
  const categoryFilter = useHospitalStore((s) => s.categoryFilter);
  const setHospitalId = useHospitalStore((s) => s.setHospitalId);
  const setCategoryFilter = useHospitalStore((s) => s.setCategoryFilter);
  const openDetail = useHospitalProfileStore((s) => s.openDetail);
  const isDetailOpen = useHospitalProfileStore((s) => s.isDetailOpen);
  const detailHospitalId = useHospitalProfileStore((s) => s.detailHospitalId);
  const closeDetail = useHospitalProfileStore((s) => s.closeDetail);

  const filtered =
    categoryFilter === "all"
      ? HOSPITAL_CATALOG
      : HOSPITAL_CATALOG.filter((h) => h.category === categoryFilter);

  const selected = HOSPITAL_CATALOG.find((h) => h.id === selectedId);
  const selectedProfile = selected ? getHospitalProfileForCatalog(selected) : undefined;
  const detailProfile = detailHospitalId
    ? getHospitalProfileByIdSafe(detailHospitalId)
    : selectedProfile;

  const handleSelectHospital = (hospital: HospitalCatalogEntry) => {
    if (selectedId === hospital.id) {
      openDetail(hospital.id);
    } else {
      setHospitalId(hospital.id);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div className="flex items-center gap-1.5 px-1">
        <Building2 className="h-3.5 w-3.5 text-mint-dark" />
        <span className="text-[11px] font-medium text-muted">
          제휴 병원 네트워크 — 선택 병원 유튜브만 RAG 추천
        </span>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <CategoryTab
          label="전체"
          active={categoryFilter === "all"}
          onClick={() => setCategoryFilter("all")}
        />
        {CATEGORY_ORDER.map((cat) => (
          <CategoryTab
            key={cat}
            label={HOSPITAL_CATEGORY_LABELS[cat]}
            active={categoryFilter === cat}
            onClick={() => setCategoryFilter(cat)}
          />
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filtered.map((hospital) => (
          <HospitalChip
            key={hospital.id}
            hospital={hospital}
            selected={selectedId === hospital.id}
            onSelect={() => handleSelectHospital(hospital)}
          />
        ))}
      </div>

      {selected && selectedProfile && (
        <HospitalProfileCard
          profile={selectedProfile}
          hospitalName={selected.name}
          onDetailClick={() => openDetail(selected.id)}
        />
      )}

      {selected?.partnership.status === "prospect" && (
        <p className="flex items-center gap-1 px-1 text-[10px] text-lavender">
          <Handshake className="h-3 w-3" />
          제휴·리퍼럴 협상 대상 병원
        </p>
      )}

      <HospitalProfileModal
        isOpen={isDetailOpen}
        profile={detailProfile ?? null}
        onClose={closeDetail}
      />
    </div>
  );
}

function getHospitalProfileByIdSafe(hospitalId: string) {
  const entry = HOSPITAL_CATALOG.find((h) => h.id === hospitalId);
  return entry ? getHospitalProfileForCatalog(entry) : undefined;
}

function CategoryTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition",
        active
          ? "bg-mint text-white shadow-sm"
          : "bg-background text-muted hover:text-foreground",
      )}
    >
      {label}
    </button>
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
  const handle =
    hospital.youtubeChannels[0]?.handle ??
    hospital.youtubeChannels[0]?.label ??
    "YouTube";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "min-w-[6.5rem] shrink-0 rounded-xl border px-2.5 py-2 text-left transition active:scale-[0.98]",
        selected
          ? "border-mint/50 bg-mint/10 shadow-sm"
          : "border-border bg-surface hover:border-mint/30",
      )}
    >
      <p
        className={cn(
          "text-[11px] font-semibold leading-tight",
          selected ? "text-mint-dark" : "text-foreground",
        )}
      >
        {hospital.shortName}
      </p>
      <p className="mt-0.5 truncate text-[9px] text-muted">{handle}</p>
    </button>
  );
}
