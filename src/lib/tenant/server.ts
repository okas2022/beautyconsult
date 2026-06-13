import type { NextRequest } from "next/server";
import { TENANT_COOKIE, TENANT_HEADER } from "@/lib/tenant/constants";
import { resolveTenantHospitalId } from "@/lib/tenant/resolve-tenant";

export function getTenantHospitalIdFromRequest(
  request: NextRequest,
  bodyHospitalId?: string | null,
): string {
  const fromHeader = request.headers.get(TENANT_HEADER);
  const fromCookie = request.cookies.get(TENANT_COOKIE)?.value;
  return resolveTenantHospitalId(bodyHospitalId, fromHeader ?? fromCookie);
}
