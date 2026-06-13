import { NextResponse, type NextRequest } from "next/server";
import {
  TENANT_COOKIE,
  TENANT_HEADER,
  TENANT_SLUG_COOKIE,
} from "@/lib/tenant/constants";
import { resolveTenantFromRequest } from "@/lib/tenant/resolve-tenant";

export function middleware(request: NextRequest) {
  const tenant = resolveTenantFromRequest({
    host: request.headers.get("host") ?? "",
    searchParams: request.nextUrl.searchParams,
  });

  const requestHeaders = new Headers(request.headers);

  if (tenant) {
    requestHeaders.set(TENANT_HEADER, tenant.hospitalId);

    const response = NextResponse.next({
      request: { headers: requestHeaders },
    });

    response.cookies.set(TENANT_COOKIE, tenant.hospitalId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });
    response.cookies.set(TENANT_SLUG_COOKIE, tenant.slug, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  }

  const existingId = request.cookies.get(TENANT_COOKIE)?.value;
  if (existingId) {
    requestHeaders.set(TENANT_HEADER, existingId);
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
