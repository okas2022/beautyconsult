"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { getHospitalBySlug } from "@/features/hospitals/constants/hospitals";
import { useHospitalStore } from "@/features/hospitals/store/hospitalStore";
import {
  TENANT_COOKIE,
  TENANT_SLUG_COOKIE,
} from "@/lib/tenant/constants";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

/** URL 파라미터·서브도메인 쿠키 → Zustand 병원 선택 동기화 */
export function TenantBootstrap() {
  const setHospitalId = useHospitalStore((s) => s.setHospitalId);
  const searchParams = useSearchParams();

  useEffect(() => {
    const slugParam =
      searchParams.get("hospital") ??
      searchParams.get("tenant") ??
      searchParams.get("hospital_slug");
    const idParam = searchParams.get("hospital_id");

    if (slugParam) {
      const entry = getHospitalBySlug(slugParam);
      if (entry) {
        setHospitalId(entry.id);
        return;
      }
    }

    if (idParam) {
      setHospitalId(idParam);
      return;
    }

    const cookieId = readCookie(TENANT_COOKIE);
    if (cookieId) {
      setHospitalId(cookieId);
      return;
    }

    const cookieSlug = readCookie(TENANT_SLUG_COOKIE);
    if (cookieSlug) {
      const entry = getHospitalBySlug(cookieSlug);
      if (entry) setHospitalId(entry.id);
    }
  }, [searchParams, setHospitalId]);

  return null;
}
