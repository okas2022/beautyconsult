import { NextRequest, NextResponse } from "next/server";
import { unauthorizedResponse, verifyAdminRequest } from "@/lib/admin/auth";
import { updateLeadStatus } from "@/lib/leads/lead-service";
import type { LeadStatus } from "@/features/leads/types/lead.types";

const VALID_STATUSES: LeadStatus[] = ["pending", "contacted", "visited"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!verifyAdminRequest(request)) {
    return unauthorizedResponse();
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const status = body?.status as LeadStatus;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const lead = await updateLeadStatus(id, status);
    return NextResponse.json({ lead });
  } catch (error) {
    console.error("[api/leads/[id]] PATCH error:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}
