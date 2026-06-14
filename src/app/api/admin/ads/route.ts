import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin/auth";
import {
  listAllAdPlacements,
  updateAdPlacement,
} from "@/lib/ads/ad-service";
import type { AdPlacementId } from "@/features/ads/types/ad.types";
import { AD_PLACEMENT_IDS } from "@/features/ads/constants/placements";

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const placements = await listAllAdPlacements();
    return NextResponse.json({ placements });
  } catch {
    return NextResponse.json({ error: "Failed to load placements" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id.trim() : "";

    if (!AD_PLACEMENT_IDS.includes(id as AdPlacementId)) {
      return NextResponse.json({ error: "Invalid placement id" }, { status: 400 });
    }

    const patch = {
      is_enabled:
        typeof body.is_enabled === "boolean" ? body.is_enabled : undefined,
      media_type:
        body.media_type === "image" || body.media_type === "video"
          ? body.media_type
          : body.media_type === null
            ? null
            : undefined,
      media_url:
        typeof body.media_url === "string"
          ? body.media_url.trim() || null
          : body.media_url === null
            ? null
            : undefined,
      click_url:
        typeof body.click_url === "string"
          ? body.click_url.trim() || null
          : body.click_url === null
            ? null
            : undefined,
      alt_text:
        typeof body.alt_text === "string"
          ? body.alt_text.trim() || null
          : body.alt_text === null
            ? null
            : undefined,
    };

    const placement = await updateAdPlacement(id as AdPlacementId, patch);
    return NextResponse.json({ placement });
  } catch (error) {
    if (error instanceof Error && error.message === "MEDIA_REQUIRED") {
      return NextResponse.json(
        { error: "ON 상태에서는 미디어 URL이 필요합니다." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
