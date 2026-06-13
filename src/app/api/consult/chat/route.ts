import { NextRequest, NextResponse } from "next/server";
import {
  generateConsultReply,
  type ConsultChatMessage,
  type ConsultPriceContext,
} from "@/lib/consult-gemini";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const userText = typeof body?.userText === "string" ? body.userText.trim() : "";
  const category = typeof body?.category === "string" ? body.category.trim() : "";
  const procedureName = typeof body?.procedureName === "string" ? body.procedureName.trim() : "";
  const concernTags = Array.isArray(body?.concernTags)
    ? body.concernTags.filter((v: unknown) => typeof v === "string").slice(0, 8)
    : [];
  const hasAnalysis = Boolean(body?.hasAnalysis);
  const history = Array.isArray(body?.history)
    ? (body.history as ConsultChatMessage[])
        .filter(
          (m) =>
            m &&
            (m.role === "user" || m.role === "agent") &&
            typeof m.content === "string" &&
            m.content.trim()
        )
        .slice(-8)
        .map((m) => ({ role: m.role, content: m.content.trim() }))
    : [];
  const priceContext =
    body?.priceContext && typeof body.priceContext === "object"
      ? (body.priceContext as ConsultPriceContext)
      : undefined;

  if (!userText) {
    return NextResponse.json({ error: "userText is required" }, { status: 400 });
  }

  const result = await generateConsultReply({
    userText,
    category: category || undefined,
    procedureName: procedureName || undefined,
    concernTags,
    hasAnalysis,
    history,
    priceContext,
  });

  return NextResponse.json(result);
}
