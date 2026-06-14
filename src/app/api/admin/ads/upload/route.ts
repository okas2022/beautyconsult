import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin/auth";
import {
  adMediaUploadErrorMessage,
  createAdMediaUploadPlan,
  saveAdMediaLocal,
} from "@/lib/ads/upload-ad-media";
import type { AdMediaType, AdPlacementId } from "@/features/ads/types/ad.types";
import { AD_PLACEMENT_IDS } from "@/features/ads/constants/placements";

function isMediaType(value: unknown): value is AdMediaType {
  return value === "image" || value === "video";
}

/** JSON: signed upload URL 발급 (클라이언트 → Supabase 직접 PUT) */
export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleDirectUpload(request);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const placementId =
      typeof body?.placement_id === "string" ? body.placement_id.trim() : "";
    const filename = typeof body?.filename === "string" ? body.filename.trim() : "";
    const fileContentType =
      typeof body?.content_type === "string" ? body.content_type.trim() : "";
    const mediaType = body?.media_type;
    const fileSize = Number(body?.file_size ?? 0);

    if (!AD_PLACEMENT_IDS.includes(placementId as AdPlacementId)) {
      return NextResponse.json({ error: "Invalid placement id" }, { status: 400 });
    }
    if (!filename || !fileContentType || !isMediaType(mediaType) || !fileSize) {
      return NextResponse.json({ error: "Missing upload metadata" }, { status: 400 });
    }

    const plan = await createAdMediaUploadPlan({
      placementId,
      filename,
      contentType: fileContentType,
      mediaType,
      fileSize,
    });

    return NextResponse.json(plan);
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
    return NextResponse.json(
      { error: adMediaUploadErrorMessage(code), code },
      { status: code.startsWith("INVALID") || code.endsWith("TOO_LARGE") ? 400 : 500 },
    );
  }
}

/** 로컬 dev fallback — multipart 직접 저장 */
async function handleDirectUpload(request: NextRequest) {
  if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
    return NextResponse.json(
      {
        error:
          "프로덕션에서는 signed URL 업로드를 사용합니다. 파일 선택 후 업로드 버튼을 눌러 주세요.",
      },
      { status: 400 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const placementId = String(form.get("placement_id") ?? "").trim();
    const mediaTypeRaw = form.get("media_type");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }
    if (!AD_PLACEMENT_IDS.includes(placementId as AdPlacementId)) {
      return NextResponse.json({ error: "Invalid placement id" }, { status: 400 });
    }
    if (!isMediaType(mediaTypeRaw)) {
      return NextResponse.json({ error: "Invalid media type" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await saveAdMediaLocal({
      placementId,
      filename: file.name,
      contentType: file.type,
      mediaType: mediaTypeRaw,
      fileSize: file.size,
      buffer,
    });

    return NextResponse.json({ publicUrl, path: publicUrl });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPLOAD_FAILED";
    return NextResponse.json(
      { error: adMediaUploadErrorMessage(code), code },
      { status: 400 },
    );
  }
}
