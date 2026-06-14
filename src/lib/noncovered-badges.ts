import type { NoncoveredPriceRow } from "./noncovered-pricing";

export type PriceBadgeTone = "positive" | "neutral" | "warning" | "danger";

export interface PriceBadge {
  label: string;
  tone: PriceBadgeTone;
}

function isIncluded(value: string): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "y" || v === "true" || v === "yes" || v === "포함";
}

function isExcluded(value: string): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "n" || v === "false" || v === "no" || v === "별도";
}

function isUnknown(value: string): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return !v || v === "unknown" || v === "미확인";
}

export function buildPriceBadges(row: NoncoveredPriceRow): PriceBadge[] {
  const badges: PriceBadge[] = [];

  if (isIncluded(row.vat_included)) {
    badges.push({ label: "부가세 포함", tone: "positive" });
  } else if (isExcluded(row.vat_included)) {
    badges.push({ label: "VAT 10% 별도", tone: "danger" });
  }

  if (isIncluded(row.anesthesia_included)) {
    badges.push({ label: "마취비 포함", tone: "positive" });
  } else if (isExcluded(row.anesthesia_included)) {
    badges.push({ label: "마취비 별도", tone: "warning" });
  }

  if (isIncluded(row.materials_included)) {
    badges.push({ label: "재료대 포함", tone: "positive" });
  } else if (isExcluded(row.materials_included)) {
    badges.push({ label: "재료대 별도", tone: "warning" });
  } else if (isUnknown(row.materials_included)) {
    badges.push({ label: "재료대 확인 필요", tone: "neutral" });
  }

  return badges;
}

export function formatPriceRange(min: number, max: number): {
  primary: string;
  secondary?: string;
  isFixed: boolean;
} {
  const fmt = (n: number) => n.toLocaleString("ko-KR");
  if (min === max) {
    return { primary: `${fmt(min)}원`, isFixed: true };
  }
  return {
    primary: `${fmt(min)}원`,
    secondary: `~ ${fmt(max)}원`,
    isFixed: false,
  };
}
