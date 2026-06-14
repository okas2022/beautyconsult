import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdMediaType } from "@/features/ads/types/ad.types";

const BUCKET = "ad-media";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 50 * 1024 * 1024;

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

export interface AdMediaUploadPlan {
  signedUrl: string;
  token: string;
  path: string;
  publicUrl: string;
}

function extensionFor(contentType: string, filename: string): string {
  const fromName = path.extname(filename).toLowerCase();
  if (fromName) return fromName;
  if (contentType === "image/jpeg") return ".jpg";
  if (contentType === "image/png") return ".png";
  if (contentType === "image/webp") return ".webp";
  if (contentType === "image/gif") return ".gif";
  if (contentType === "video/mp4") return ".mp4";
  if (contentType === "video/webm") return ".webm";
  if (contentType === "video/quicktime") return ".mov";
  return "";
}

export function validateAdMediaUpload(input: {
  contentType: string;
  mediaType: AdMediaType;
  fileSize: number;
}): void {
  const { contentType, mediaType, fileSize } = input;

  if (mediaType === "image") {
    if (!IMAGE_TYPES.has(contentType)) {
      throw new Error("INVALID_IMAGE_TYPE");
    }
    if (fileSize > MAX_IMAGE_BYTES) {
      throw new Error("IMAGE_TOO_LARGE");
    }
    return;
  }

  if (mediaType === "video") {
    if (!VIDEO_TYPES.has(contentType)) {
      throw new Error("INVALID_VIDEO_TYPE");
    }
    if (fileSize > MAX_VIDEO_BYTES) {
      throw new Error("VIDEO_TOO_LARGE");
    }
    return;
  }

  throw new Error("INVALID_MEDIA_TYPE");
}

function buildPublicUrl(storagePath: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  if (!base) throw new Error("SUPABASE_NOT_CONFIGURED");
  return `${base}/storage/v1/object/public/${BUCKET}/${storagePath}`;
}

export async function createAdMediaUploadPlan(input: {
  placementId: string;
  filename: string;
  contentType: string;
  mediaType: AdMediaType;
  fileSize: number;
}): Promise<AdMediaUploadPlan> {
  validateAdMediaUpload(input);

  const ext = extensionFor(input.contentType, input.filename);
  const storagePath = `placements/${input.placementId}/${randomUUID()}${ext}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath, { upsert: true });

  if (error || !data?.signedUrl) {
    console.error("[createAdMediaUploadPlan]", error);
    throw new Error("STORAGE_UNAVAILABLE");
  }

  return {
    signedUrl: data.signedUrl,
    token: data.token,
    path: storagePath,
    publicUrl: buildPublicUrl(storagePath),
  };
}

/** Supabase Storage 미설정 시 로컬 dev fallback */
export async function saveAdMediaLocal(input: {
  placementId: string;
  filename: string;
  contentType: string;
  mediaType: AdMediaType;
  fileSize: number;
  buffer: Buffer;
}): Promise<string> {
  validateAdMediaUpload(input);

  const ext = extensionFor(input.contentType, input.filename) || ".bin";
  const name = `${randomUUID()}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", "ads", input.placementId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), input.buffer);
  return `/uploads/ads/${input.placementId}/${name}`;
}

export function adMediaUploadErrorMessage(code: string): string {
  switch (code) {
    case "INVALID_IMAGE_TYPE":
      return "jpg, png, webp, gif 이미지만 업로드할 수 있습니다.";
    case "INVALID_VIDEO_TYPE":
      return "mp4, webm, mov 동영상만 업로드할 수 있습니다.";
    case "IMAGE_TOO_LARGE":
      return "이미지는 10MB 이하만 업로드할 수 있습니다.";
    case "VIDEO_TOO_LARGE":
      return "동영상은 50MB 이하만 업로드할 수 있습니다.";
    case "STORAGE_UNAVAILABLE":
      return "Storage 버킷(ad-media)이 없습니다. Supabase SQL Editor에서 ad_media_storage 마이그레이션을 적용해 주세요.";
    case "SUPABASE_NOT_CONFIGURED":
      return "Supabase 환경 변수가 설정되지 않았습니다.";
    default:
      return "미디어 업로드에 실패했습니다.";
  }
}
