"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  X,
} from "lucide-react";
import type { HospitalProfile } from "@/features/hospitals/types/hospital-profile.types";
import { getHospitalCatalogEntry } from "@/features/hospitals/constants/hospitals";

interface HospitalProfileModalProps {
  isOpen: boolean;
  profile: HospitalProfile | null;
  onClose: () => void;
}

export function HospitalProfileModal({
  isOpen,
  profile,
  onClose,
}: HospitalProfileModalProps) {
  if (!profile) return null;

  const catalog = getHospitalCatalogEntry(profile.hospitalId);
  const hospitalName = catalog?.name ?? profile.slug;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed inset-x-3 bottom-3 top-[12%] z-[121] mx-auto flex max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl sm:inset-x-4"
          >
            <div className="shrink-0 border-b border-border/60 bg-gradient-to-br from-mint/10 to-lavender/5 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{hospitalName}</h2>
                  <p className="mt-0.5 text-xs text-mint-dark">{profile.tagline}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-muted hover:bg-black/5"
                  aria-label="닫기"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              <section className="mb-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  병원 소개
                </h3>
                {profile.introFull.split("\n\n").map((para) => (
                  <p key={para.slice(0, 24)} className="mb-2 text-sm leading-relaxed text-foreground/90">
                    {para}
                  </p>
                ))}
              </section>

              <section className="mb-5 rounded-2xl border border-border/60 bg-background p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  방문 안내
                </h3>
                <dl className="space-y-2.5 text-sm">
                  <div className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-mint-dark" />
                    <div>
                      <dt className="sr-only">주소</dt>
                      <dd>{profile.address}</dd>
                      {profile.addressDetail && (
                        <dd className="text-xs text-muted">{profile.addressDetail}</dd>
                      )}
                      {profile.mapUrl && (
                        <a
                          href={profile.mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-mint-dark hover:underline"
                        >
                          지도 보기
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                  {profile.phone && (
                    <div className="flex gap-2">
                      <Phone className="h-4 w-4 shrink-0 text-mint-dark" />
                      <dd>{profile.phone}</dd>
                    </div>
                  )}
                  {profile.hours && (
                    <div className="flex gap-2">
                      <Clock className="h-4 w-4 shrink-0 text-mint-dark" />
                      <dd>{profile.hours}</dd>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <ExternalLink className="h-4 w-4 shrink-0 text-mint-dark" />
                    <dd>
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-mint-dark hover:underline"
                      >
                        {profile.website.replace(/^https?:\/\//, "")}
                      </a>
                    </dd>
                  </div>
                </dl>
              </section>

              {catalog && (
                <section className="mb-5">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                    전문 분야
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {catalog.specialties.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-mint/10 px-3 py-1 text-xs font-medium text-mint-dark"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                  원장 프로필
                </h3>
                <div className="space-y-3">
                  {profile.doctors.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex gap-3 rounded-2xl border border-border/60 bg-background p-3"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={doc.photoUrl}
                          alt={doc.name}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm text-foreground">{doc.name}</p>
                        <p className="text-[11px] text-mint-dark">{doc.title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-muted">{doc.bio}</p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {doc.specialties.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-lavender/10 px-2 py-0.5 text-[10px] text-lavender"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                        {doc.career && doc.career.length > 0 && (
                          <ul className="mt-2 space-y-0.5 border-t border-border/40 pt-2">
                            {doc.career.map((line) => (
                              <li key={line} className="text-[10px] text-muted">
                                · {line}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
