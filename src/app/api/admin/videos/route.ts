import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin/auth";
import {
  addHospitalVideo,
  deleteHospitalVideo,
  getHospital,
  listHospitalVideos,
} from "@/lib/hospitals/hospital-video-service";
import { DEFAULT_HOSPITAL_ID } from "@/features/leads/types/lead.types";

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const hospitalId =
      request.nextUrl.searchParams.get("hospital_id") ?? DEFAULT_HOSPITAL_ID;
    const [hospital, videos] = await Promise.all([
      getHospital(hospitalId),
      listHospitalVideos(hospitalId),
    ]);

    return NextResponse.json({ hospital, videos });
  } catch (error) {
    console.error("[api/admin/videos] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch videos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    const hospitalId =
      typeof body?.hospital_id === "string" && body.hospital_id.trim()
        ? body.hospital_id.trim()
        : DEFAULT_HOSPITAL_ID;

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const video = await addHospitalVideo(hospitalId, url);
    return NextResponse.json({ video });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UNKNOWN";

    if (code === "INVALID_URL") {
      return NextResponse.json({ error: "유효한 YouTube URL을 입력해 주세요." }, { status: 400 });
    }
    if (code === "NOT_SUBSCRIBED") {
      return NextResponse.json(
        { error: "구독 중인 병원만 영상을 등록할 수 있습니다." },
        { status: 403 },
      );
    }
    if (code === "HOSPITAL_NOT_FOUND") {
      return NextResponse.json({ error: "병원을 찾을 수 없습니다." }, { status: 404 });
    }

    console.error("[api/admin/videos] POST error:", error);
    return NextResponse.json({ error: "영상 등록에 실패했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    const hospitalId =
      typeof body?.hospital_id === "string" && body.hospital_id.trim()
        ? body.hospital_id.trim()
        : DEFAULT_HOSPITAL_ID;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    await deleteHospitalVideo(id, hospitalId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[api/admin/videos] DELETE error:", error);
    return NextResponse.json({ error: "삭제에 실패했습니다." }, { status: 500 });
  }
}
