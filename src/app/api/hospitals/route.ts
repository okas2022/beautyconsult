import { NextResponse } from "next/server";
import {
  HOSPITAL_CATALOG,
  HOSPITAL_CATEGORY_LABELS,
} from "@/features/hospitals/constants/hospitals";

/** 공개 병원 네트워크 목록 (리퍼럴·RAG 선택용) */
export async function GET() {
  return NextResponse.json({
    categories: HOSPITAL_CATEGORY_LABELS,
    hospitals: HOSPITAL_CATALOG.map((h) => ({
      id: h.id,
      slug: h.slug,
      name: h.name,
      shortName: h.shortName,
      category: h.category,
      specialties: h.specialties,
      youtubeChannels: h.youtubeChannels,
      isSubscribed: h.isSubscribed,
      partnership: {
        status: h.partnership.status,
        cpaFeeKrw: h.partnership.cpaFeeKrw,
        revenueSharePct: h.partnership.revenueSharePct,
      },
      description: h.description,
    })),
  });
}
