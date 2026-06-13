import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin/auth";
import { listLeads } from "@/lib/leads/lead-service";

export async function GET(request: NextRequest) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const hospitalId = request.nextUrl.searchParams.get("hospital_id") ?? undefined;
    const leads = await listLeads(hospitalId ?? undefined);
    return NextResponse.json({ leads });
  } catch (error) {
    console.error("[api/leads] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}
