import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin/auth";
import {
  getHospital,
  updateHospitalSubscription,
} from "@/lib/hospitals/hospital-video-service";
import { getTenantHospitalIdFromRequest } from "@/lib/tenant/server";

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const queryId = request.nextUrl.searchParams.get("hospital_id");
    const hospitalId = getTenantHospitalIdFromRequest(request, queryId);
    const hospital = await getHospital(hospitalId);

    if (!hospital) {
      return NextResponse.json({ error: "병원을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({
      hospital,
      plan: {
        name: "유튜브 답변 Pro",
        priceKrw: 990_000,
        billingCycle: "monthly",
      },
    });
  } catch (error) {
    console.error("[api/admin/subscription] GET error:", error);
    return NextResponse.json({ error: "구독 정보 조회 실패" }, { status: 500 });
  }
}

/** PoC: 결제 연동 전 구독 활성화 시뮬레이션 (관리자 키 필요) */
export async function POST(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json().catch(() => ({}));
    const action = typeof body?.action === "string" ? body.action : "activate";
    const hospitalId = getTenantHospitalIdFromRequest(
      request,
      typeof body?.hospital_id === "string" ? body.hospital_id : null,
    );

    const hospital = await getHospital(hospitalId);
    if (!hospital) {
      return NextResponse.json({ error: "병원을 찾을 수 없습니다." }, { status: 404 });
    }

    if (action === "deactivate") {
      const updated = await updateHospitalSubscription(hospitalId, false);
      return NextResponse.json({ hospital: updated, message: "구독이 해지되었습니다." });
    }

    const updated = await updateHospitalSubscription(hospitalId, true);
    return NextResponse.json({
      hospital: updated,
      message: "유튜브 답변 Pro 구독이 활성화되었습니다. (PoC 결제 시뮬레이션)",
    });
  } catch (error) {
    console.error("[api/admin/subscription] POST error:", error);
    return NextResponse.json({ error: "구독 처리 실패" }, { status: 500 });
  }
}
