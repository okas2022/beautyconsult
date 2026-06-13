import { NextRequest, NextResponse } from "next/server";
import {
  extractVideoRefsFromText,
  mergeVideoRefs,
  videoKnowledgeToRefs,
} from "@/lib/chat/parse-youtube-links";
import { matchProductsBySymptoms } from "@/lib/commerce/product-catalog";
import { generateChatReply } from "@/lib/gemini/chat-service";
import {
  loadHospitalKnowledgeForRefs,
  loadHospitalRagContext,
} from "@/lib/knowledge/hospital-rag";
import { getTenantHospitalIdFromRequest } from "@/lib/tenant/server";

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
          .slice(-6)
          .map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content.trim(),
          }))
      : [];

    if (!message) {
      return NextResponse.json({ error: "message is required" }, { status: 400 });
    }

    const [result, knowledge, rag] = await Promise.all([
      generateChatReply({ message, history, hospitalId }),
      loadHospitalKnowledgeForRefs(hospitalId),
      loadHospitalRagContext(message, hospitalId),
    ]);

    const fromReply = extractVideoRefsFromText(result.reply, knowledge);
    const fromRag = videoKnowledgeToRefs(rag.videos);
    const videoRefs = mergeVideoRefs(fromReply, fromRag);
    const products = matchProductsBySymptoms(result.symptomKeywords);

    return NextResponse.json({
      reply: result.reply,
      videoRefs: videoRefs.length ? videoRefs : undefined,
      symptomKeywords: result.symptomKeywords.length
        ? result.symptomKeywords
        : undefined,
      products: products.length ? products : undefined,
      nextActions: ["원장님께 예약 / 상담 신청"],
      model: result.model,
      source: result.source,
    });
  } catch (error) {
    console.error("[api/chat] unexpected error:", error);
    return NextResponse.json(
      {
        error: "internal_error",
        reply:
          "일시적인 오류가 발생했습니다. 잠시 후 다시 질문해 주시면, 원장님 대본 자료를 바탕으로 답변드리겠습니다.",
        source: "fallback",
      },
      { status: 500 },
    );
  }
}
