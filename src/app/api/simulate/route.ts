import { NextRequest, NextResponse } from "next/server";
import type {
  ProcedureType,
  SimulateResponse,
} from "@/features/simulate/types/simulate.types";
import {
  generateInpaintSimulation,
  isReplicateConfigured,
  parseSimulateError,
} from "@/lib/replicate/inpaint-service";
import { requireSimulateAccess } from "@/lib/premium/require-premium";
import { recordSimulateUsage } from "@/lib/users/user-service";

export const maxDuration = 120;

const VALID_PROCEDURES: ProcedureType[] = ["eyes", "nose", "breast"];
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const imageBase64 =
      typeof body?.imageBase64 === "string" ? body.imageBase64.trim() : "";
    const mimeType =
      typeof body?.mimeType === "string" ? body.mimeType : "image/jpeg";
    const procedure = body?.procedure as ProcedureType;
    const intensity =
      typeof body?.intensity === "number" ? body.intensity : 50;
    const userId =
      typeof body?.user_id === "string" ? body.user_id.trim() : "";

    const auth = await requireSimulateAccess(userId);
    if (!auth.ok) return auth.response;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "imageBase64 is required", code: "GENERATION_FAILED" },
        { status: 400 },
      );
    }

    if (!VALID_PROCEDURES.includes(procedure)) {
      return NextResponse.json(
        { error: "procedure must be eyes, nose, or breast", code: "GENERATION_FAILED" },
        { status: 400 },
      );
    }

    const rawBase64 = imageBase64.includes(",")
      ? (imageBase64.split(",")[1] ?? imageBase64)
      : imageBase64;

    const byteLength = Buffer.byteLength(rawBase64, "base64");
    if (byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "이미지 크기는 8MB 이하여야 합니다.", code: "GENERATION_FAILED" },
        { status: 400 },
      );
    }

    const result = await generateInpaintSimulation({
      imageBase64: rawBase64,
      mimeType,
      procedure,
      intensity: Math.min(100, Math.max(0, intensity)),
    });

    const response: SimulateResponse = {
      beforeImage: `data:${mimeType};base64,${rawBase64}`,
      afterImage: `data:image/png;base64,${result.afterImageBase64}`,
      procedure,
      intensity,
      prompt: result.prompt,
      strength: result.strength,
      source: result.source,
    };

    if (!isReplicateConfigured()) {
      response.source = "demo";
    }

    if (!auth.isPremium) {
      await recordSimulateUsage(userId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[api/simulate] error:", error);
    const parsed = parseSimulateError(error);
    const status =
      parsed.code === "RATE_LIMIT"
        ? 429
        : parsed.code === "FACE_NOT_DETECTED"
          ? 422
          : 500;

    return NextResponse.json(parsed, { status });
  }
}
