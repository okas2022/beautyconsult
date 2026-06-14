import { NextResponse } from "next/server";
import { listActiveAdPlacements } from "@/lib/ads/ad-service";

export async function GET() {
  try {
    const placements = await listActiveAdPlacements();
    return NextResponse.json({ placements });
  } catch {
    return NextResponse.json({ placements: [] });
  }
}
