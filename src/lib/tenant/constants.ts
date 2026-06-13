/** Middleware → downstream request header */
export const TENANT_HEADER = "x-hospital-id";

/** Browser cookie (synced with Zustand hospital store) */
export const TENANT_COOKIE = "prefit-hospital-id";

export const TENANT_SLUG_COOKIE = "prefit-hospital-slug";

/** Reserved subdomains — not treated as hospital tenants */
export const RESERVED_SUBDOMAINS = new Set([
  "www",
  "admin",
  "api",
  "app",
  "staging",
]);
