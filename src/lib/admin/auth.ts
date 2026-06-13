const ADMIN_HEADER = "x-admin-key";

export function verifyAdminRequest(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET_KEY;
  if (!secret) {
    // PoC: admin routes open when secret not configured (dev only)
    return process.env.NODE_ENV === "development";
  }
  const key = request.headers.get(ADMIN_HEADER);
  return key === secret;
}

export function unauthorizedResponse() {
  return Response.json({ error: "Unauthorized" }, { status: 401 });
}

export { ADMIN_HEADER };
