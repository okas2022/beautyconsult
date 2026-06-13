"use client";

import Image from "next/image";
import {
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Stethoscope,
} from "lucide-react";
import type { HospitalProfile } from "@/features/hospitals/types/hospital-profile.types";
import { cn } from "@/lib/utils";

interface HospitalProfileCardProps {
  profile: HospitalProfile;
  hospitalName: string;
  onDetailClick: () => void;
  className?: string;
}

export function HospitalProfileCard({
  profile,
  hospitalName,
  onDetailClick,
  className,
}: HospitalProfileCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-mint/25 bg-gradient-to-br from-mint/5 to-surface p-3.5",
        className,
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-mint-dark">{hospitalName}</p>
          <p className="mt-0.5 text-[10px] text-muted line-clamp-1">{profile.tagline}</p>
        </div>
        <button
          type="button"
          onClick={onDetailClick}
          className="shrink-0 flex items-center gap-0.5 rounded-full bg-mint/10 px-2.5 py-1 text-[10px] font-semibold text-mint-dark transition hover:bg-mint/20"
        >
          자세히
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <p className="mb-2.5 text-[11px] leading-relaxed text-foreground/90 line-clamp-2">
        {profile.introShort}
      </p>

      <div className="mb-2.5 space-y-1 text-[10px] text-muted">
        <p className="flex items-start gap-1.5">
          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-mint-dark" />
          <span className="line-clamp-1">{profile.address}</span>
        </p>
        {profile.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0 text-mint-dark" />
            {profile.phone}
          </p>
        )}
        {profile.hours && (
          <p className="flex items-center gap-1.5">
            <Clock className="h-3 w-3 shrink-0 text-mint-dark" />
            {profile.hours}
          </p>
        )}
        <a
          href={profile.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-mint-dark hover:underline"
        >
          홈페이지
          <ExternalLink className="h-2.5 w-2.5" />
        </a>
      </div>

      <div className="mb-2 flex flex-wrap gap-1">
        {profile.highlights.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-surface px-2 py-0.5 text-[9px] text-muted ring-1 ring-border/60"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border/50 pt-2.5">
        <Stethoscope className="h-3.5 w-3.5 shrink-0 text-lavender" />
        <div className="flex -space-x-2">
          {profile.doctors.slice(0, 4).map((doc) => (
            <div
              key={doc.id}
              className="relative h-8 w-8 overflow-hidden rounded-full ring-2 ring-surface"
              title={`${doc.name} ${doc.title}`}
            >
              <Image
                src={doc.photoUrl}
                alt={doc.name}
                fill
                className="object-cover"
                sizes="32px"
              />
            </div>
          ))}
        </div>
        <p className="text-[10px] text-muted">
          {profile.doctors.length}명 원장 ·{" "}
          {profile.doctors[0]?.specialties.slice(0, 2).join(", ")} 등
        </p>
      </div>
    </div>
  );
}
