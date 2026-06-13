import { NextRequest, NextResponse } from "next/server";
import { requirePremiumUser } from "@/lib/premium/require-premium";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const userId =
      typeof body?.user_id === "string" ? body.user_id.trim() : "";

    const auth = await requirePremiumUser(userId);
    if (!auth.ok) return auth.response;

    return NextResponse.json({
      report_id: crypto.randomUUID(),
      generated_at: new Date().toISOString(),
      summary:
        "피부 장벽·수분·색소·탄력 지표를 종합 분석한 정밀 리포트입니다. (데모)",
      scores: {
        hydration: 72,
        barrier: 68,
        pigmentation: 55,
        elasticity: 61,
      },
      recommendations: [
        "저자극 보습제로 장벽 강화",
        "자외선 차단제 매일 사용",
        "과도한 각질 제거 자제",
      ],
    });
  } catch {
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
