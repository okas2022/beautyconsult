import { NextRequest, NextResponse } from "next/server";
import { searchRoadAddress } from "@/lib/address/juso-api";

export async function GET(request: NextRequest) {
  const keyword = request.nextUrl.searchParams.get("keyword")?.trim() ?? "";
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");

  if (keyword.length < 2) {
    return NextResponse.json({ items: [], total: 0 });
  }

  try {
    const result = await searchRoadAddress(keyword, page);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[api/address/search]", error);
    return NextResponse.json(
      { error: "주소 검색에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 502 },
    );
  }
}
