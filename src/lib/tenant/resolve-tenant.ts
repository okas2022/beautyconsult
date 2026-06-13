import {
  HOSPITAL_CATALOG,
  getHospitalCatalogEntry,
  WITH_HOSPITAL_ID,
  type HospitalCatalogEntry,
} from "@/features/hospitals/constants/hospitals";
import { RESERVED_SUBDOMAINS } from "@/lib/tenant/constants";

export interface ResolvedTenant {
  hospitalId: string;
  slug: string;
  source: "query_slug" | "query_id" | "subdomain" | "default";
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function findBySlug(slug: string): HospitalCatalogEntry | undefined {
  const normalized = slug.trim().toLowerCase();
  return HOSPITAL_CATALOG.find((h) => h.slug.toLowerCase() === normalized);
}

function findById(id: string): HospitalCatalogEntry | undefined {
  return getHospitalCatalogEntry(id);
}

/** Extract tenant slug from host (e.g. id-hospital.beutyconsult.vercel.app) */
export function extractSubdomainSlug(host: string): string | null {
  const hostname = host.split(":")[0]?.toLowerCase() ?? "";
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  const parts = hostname.split(".");

  // {slug}.localhost (local dev)
  if (parts.length === 2 && parts[1] === "localhost") {
    const sub = parts[0];
    return sub && !RESERVED_SUBDOMAINS.has(sub) ? sub : null;
  }

  // {slug}.example.com — need at least 3 labels
  if (parts.length >= 3) {
    const sub = parts[0];
    if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
    return sub;
  }

  return null;
}

export function resolveTenantFromRequest(input: {
  host: string;
  searchParams: URLSearchParams;
}): ResolvedTenant | null {
  const slugParam =
    input.searchParams.get("hospital") ??
    input.searchParams.get("tenant") ??
    input.searchParams.get("hospital_slug");
  const idParam = input.searchParams.get("hospital_id");

  if (slugParam) {
    const entry = findBySlug(slugParam);
    if (entry) {
      return { hospitalId: entry.id, slug: entry.slug, source: "query_slug" };
    }
  }

  if (idParam && UUID_RE.test(idParam)) {
    const entry = findById(idParam);
    if (entry) {
      return { hospitalId: entry.id, slug: entry.slug, source: "query_id" };
    }
  }

  const subdomain = extractSubdomainSlug(input.host);
  if (subdomain) {
    const entry = findBySlug(subdomain);
    if (entry) {
      return { hospitalId: entry.id, slug: entry.slug, source: "subdomain" };
    }
  }

  return null;
}

export function resolveTenantHospitalId(
  explicitId: string | null | undefined,
  headerOrCookieId: string | null | undefined,
): string {
  if (explicitId?.trim() && UUID_RE.test(explicitId.trim())) {
    const entry = findById(explicitId.trim());
    if (entry) return entry.id;
  }
  if (headerOrCookieId?.trim() && UUID_RE.test(headerOrCookieId.trim())) {
    const entry = findById(headerOrCookieId.trim());
    if (entry) return entry.id;
  }
  return WITH_HOSPITAL_ID;
}
