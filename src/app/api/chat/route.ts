import { NextRequest, NextResponse } from "next/server";
import { mergeVideoRefs } from "@/lib/chat/parse-youtube-links";
import {
  detectSymptomsFromText,
  matchProductsBySymptoms,
} from "@/lib/commerce/product-catalog";
import {
  generateConsultReply,
  type ConsultChatMessage,
} from "@/lib/consult-gemini";
import { getTenantHospitalIdFromRequest } from "@/lib/tenant/server";
import { applyAdDisclosureToVideoRefs } from "@/lib/hospitals/ad-disclosure";
import { resolvePriceContextForQuery } from "@/lib/pricing/resolve-price-context";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const bodyHospitalId =
      typeof body?.hospital_id === "string" ? body.hospital_id : null;
    const hospitalId = getTenantHospitalIdFromRequest(request, bodyHospitalId);

    const history = Array.isArray(body?.history)
      ? body.history
          .filter(
            (m: unknown) =>
              m &&
              typeof m === "object" &&
              "role" in m &&
              "content" in m &&
              ((m as { role: string }).role === "user" ||
                (m as { role: string }).role === "assistant") &&
              typeof (m as { content: unknown }).content === "string",
          )
          .slice(-8)
          .map((m: { role: string; content: string }) => ({
            role: (m.role === "user" ? "user" : "agent") as ConsultChatMessage["role"],
            content: m.content.trim(),
          }))
      : [];

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const priceContext = resolvePriceContextForQuery(message);

    const result = await generateConsultReply({
      userText: message,
      hospitalId,
      history,
      priceContext,
    });

    const videoRefs = applyAdDisclosureToVideoRefs(
      mergeVideoRefs(result.videoRefs ?? [], []),
      hospitalId,
    );
    const symptomKeywords = detectSymptomsFromText(message);
    const products = matchProductsBySymptoms(symptomKeywords);

    const nextActions =
      result.nextActions?.length
        ? result.nextActions
        : ["질문 계속하기", "병원 정보 자세히", "원장님께 예약 / 상담 신청"];

    return NextResponse.json({
      reply: result.reply,
      videoRefs: videoRefs.length ? videoRefs : undefined,
      symptomKeywords: symptomKeywords.length ? symptomKeywords : undefined,
      products: products.length ? products : undefined,
      nextActions,
      source: result.source,
    });
  } catch (error) {
    console.error("[api/chat] unexpected error:", error);
    return NextResponse.json(
      {
        error: "internal_error",
        reply:
          "일시적인 오류가 발생했습니다. 잠시 후 다시 질문해 주시면, 상담 실장이 차근차근 안내드리겠습니다.",
        source: "fallback",
      },
      { status: 500 },
    );
  }
}
