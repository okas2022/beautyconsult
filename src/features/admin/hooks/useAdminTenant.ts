"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import {
  getHospitalBySlug,
  HOSPITAL_CATALOG,
  WITH_HOSPITAL_ID,
} from "@/features/hospitals/constants/hospitals";
import { TENANT_COOKIE } from "@/lib/tenant/constants";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** Admin·관리 화면에서 현재 테넌트(병원) 식별 */
export function useAdminTenant() {
  const searchParams = useSearchParams();

  return useMemo(() => {
    const slugParam =
      searchParams.get("hospital") ??
      searchParams.get("tenant") ??
      searchParams.get("hospital_slug");
    const idParam = searchParams.get("hospital_id");

    if (slugParam) {
      const entry = getHospitalBySlug(slugParam);
      if (entry) return { hospitalId: entry.id, slug: entry.slug, name: entry.name };
    }

    if (idParam) {
      const entry = HOSPITAL_CATALOG.find((h) => h.id === idParam);
      if (entry) return { hospitalId: entry.id, slug: entry.slug, name: entry.name };
    }

    const cookieId = readCookie(TENANT_COOKIE);
    if (cookieId) {
      const entry = HOSPITAL_CATALOG.find((h) => h.id === cookieId);
      if (entry) return { hospitalId: entry.id, slug: entry.slug, name: entry.name };
    }

    const fallback = HOSPITAL_CATALOG.find((h) => h.id === WITH_HOSPITAL_ID)!;
    return {
      hospitalId: fallback.id,
      slug: fallback.slug,
      name: fallback.name,
    };
  }, [searchParams]);
}
