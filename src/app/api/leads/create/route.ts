import { NextRequest, NextResponse } from "next/server";
import { createLead } from "@/lib/leads/lead-service";
import type { CreateLeadRequest } from "@/features/leads/types/lead.types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as CreateLeadRequest;

    const phone_number =
      typeof body.phone_number === "string" ? body.phone_number.trim() : "";
    const patient_id =
      typeof body.patient_id === "string" ? body.patient_id.trim() : "";

    if (!phone_number || !patient_id) {
      return NextResponse.json(
        { error: "phone_number and patient_id are required" },
        { status: 400 },
      );
    }

    const messages = Array.isArray(body.messages)
      ? body.messages
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string",
          )
          .slice(-12)
      : [];

    const lead = await createLead({
      phone_number,
      patient_id,
      hospital_id: body.hospital_id,
      video_id: body.video_id,
      video_title: body.video_title,
      messages,
    });

    return NextResponse.json({
      id: lead.id,
      status: lead.status,
      consultation_summary: lead.consultation_summary,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN";

    if (message === "INVALID_PHONE") {
      return NextResponse.json(
        { error: "올바른 전화번호를 입력해 주세요." },
        { status: 400 },
      );
    }

    console.error("[api/leads/create] error:", error);
    return NextResponse.json(
      { error: "상담 신청 저장에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 },
    );
  }
}
