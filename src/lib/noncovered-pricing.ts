import fs from "fs";
import path from "path";
import { buildPriceBadges } from "./noncovered-badges";
import {
  getSynonymSuggestions,
  resolveSearchQuery,
  type ResolvedSearchQuery,
} from "./noncovered-synonyms";

export interface NoncoveredPriceRow {
  hospital_name: string;
  region: string;
  department: string;
  category: string;
  procedure_name: string;
  price_min: number;
  price_max: number;
  vat_included: string;
  anesthesia_included: string;
  materials_included: string;
  remarks: string;
  source_url: string;
  last_updated: string;
}

let cache: NoncoveredPriceRow[] | null = null;

function csvSplit(line: string): string[] {
  // current dataset has no escaped commas inside quotes, simple split is sufficient
  return line.split(",").map((v) => v.trim());
}

function loadRows(): NoncoveredPriceRow[] {
  if (cache) return cache;
  const filePath = path.join(
    process.cwd(),
    "data",
    "noncovered",
    "noncovered_prices_master.csv"
  );
  if (!fs.existsSync(filePath)) return [];

  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  const headers = csvSplit(lines[0]);
  const rows: NoncoveredPriceRow[] = [];

  for (const line of lines.slice(1)) {
    const cols = csvSplit(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = cols[i] ?? "";
    });
    rows.push({
      hospital_name: obj.hospital_name,
      region: obj.region,
      department: obj.department,
      category: obj.category,
      procedure_name: obj.procedure_name,
      price_min: Number(obj.price_min || 0),
      price_max: Number(obj.price_max || 0),
      vat_included: obj.vat_included,
      anesthesia_included: obj.anesthesia_included,
      materials_included: obj.materials_included,
      remarks: obj.remarks,
      source_url: obj.source_url,
      last_updated: obj.last_updated,
    });
  }

  cache = rows;
  return rows;
}

export interface PriceQuoteResult {
  count: number;
  min_price: number;
  max_price: number;
  vat_included_ratio: number;
  anesthesia_included_ratio: number;
  materials_included_ratio: number;
  matched_procedures: string[];
  matched_regions: string[];
  matched_hospitals: string[];
  sample_remarks: string[];
}

export interface NoncoveredSearchOptions {
  categories: string[];
  proceduresByCategory: Record<string, string[]>;
  synonymSuggestions: string[];
}

export interface NoncoveredPriceCard {
  id: string;
  hospital_name: string;
  region: string;
  category: string;
  procedure_name: string;
  price_min: number;
  price_max: number;
  badges: ReturnType<typeof buildPriceBadges>;
  remarks: string;
  source_url: string;
  last_updated: string;
}

export interface NoncoveredSearchResult {
  resolved: ResolvedSearchQuery;
  items: NoncoveredPriceCard[];
  summary: PriceQuoteResult;
}

export function getNoncoveredSearchOptions(): NoncoveredSearchOptions {
  const rows = loadRows();
  const categories = Array.from(new Set(rows.map((r) => r.category).filter(Boolean))).sort();
  const proceduresByCategory: Record<string, string[]> = {};

  for (const category of categories) {
    proceduresByCategory[category] = Array.from(
      new Set(
        rows
          .filter((r) => r.category === category)
          .map((r) => r.procedure_name)
          .filter(Boolean)
      )
    ).sort();
  }

  return {
    categories,
    proceduresByCategory,
    synonymSuggestions: getSynonymSuggestions(),
  };
}

function isIncludedFlag(value: string): boolean {
  const v = String(value ?? "").trim().toLowerCase();
  return v === "y" || v === "true" || v === "yes";
}

function rowMatchesProcedure(row: NoncoveredPriceRow, keywords: string[], rawQuery?: string): boolean {
  const name = row.procedure_name.toLowerCase();
  if (keywords.length > 0 && keywords.some((k) => name.includes(k.toLowerCase()))) {
    return true;
  }
  if (rawQuery) {
    const compact = rawQuery.replace(/\s+/g, "").toLowerCase();
    const nameCompact = name.replace(/\s+/g, "");
    if (nameCompact.includes(compact) || compact.includes(nameCompact)) return true;
  }
  return keywords.length === 0;
}

function rowToCard(row: NoncoveredPriceRow, index: number): NoncoveredPriceCard {
  return {
    id: `${row.hospital_name}-${row.procedure_name}-${index}`,
    hospital_name: row.hospital_name,
    region: row.region,
    category: row.category,
    procedure_name: row.procedure_name,
    price_min: row.price_min,
    price_max: row.price_max,
    badges: buildPriceBadges(row),
    remarks: row.remarks,
    source_url: row.source_url,
    last_updated: row.last_updated,
  };
}

function buildSummaryFromRows(filtered: NoncoveredPriceRow[]): PriceQuoteResult {
  const minPrice = Math.min(...filtered.map((r) => r.price_min));
  const maxPrice = Math.max(...filtered.map((r) => r.price_max));
  const vatIncludedCount = filtered.filter((r) => isIncludedFlag(r.vat_included)).length;
  const anesthesiaIncludedCount = filtered.filter((r) => isIncludedFlag(r.anesthesia_included)).length;
  const materialsIncludedCount = filtered.filter((r) => isIncludedFlag(r.materials_included)).length;

  return {
    count: filtered.length,
    min_price: minPrice,
    max_price: maxPrice,
    vat_included_ratio: vatIncludedCount / filtered.length,
    anesthesia_included_ratio: anesthesiaIncludedCount / filtered.length,
    materials_included_ratio: materialsIncludedCount / filtered.length,
    matched_procedures: Array.from(new Set(filtered.map((r) => r.procedure_name))).slice(0, 8),
    matched_regions: Array.from(new Set(filtered.map((r) => r.region))).slice(0, 8),
    matched_hospitals: Array.from(new Set(filtered.map((r) => r.hospital_name))).slice(0, 8),
    sample_remarks: Array.from(new Set(filtered.map((r) => r.remarks).filter(Boolean))).slice(0, 5),
  };
}

export function searchNoncoveredPrices(params: {
  q?: string;
  category?: string;
  procedureName?: string;
  vatIncludedOnly?: boolean;
  anesthesiaIncludedOnly?: boolean;
  materialsIncludedOnly?: boolean;
}): NoncoveredSearchResult | null {
  const rows = loadRows();
  if (rows.length === 0) return null;

  const resolved = params.q ? resolveSearchQuery(params.q) : { raw: "", procedureKeywords: [], source: "direct" as const };
  const category = params.category ?? resolved.category;
  const procedureKeywords = params.procedureName
    ? [params.procedureName]
    : resolved.procedureKeywords;

  const filtered = rows
    .filter((r) => {
      const categoryOk = category ? r.category.includes(category) : true;
      const procedureOk = params.procedureName
        ? r.procedure_name.includes(params.procedureName)
        : rowMatchesProcedure(r, procedureKeywords, params.q);
      const vatOk = params.vatIncludedOnly ? isIncludedFlag(r.vat_included) : true;
      const anesthesiaOk = params.anesthesiaIncludedOnly ? isIncludedFlag(r.anesthesia_included) : true;
      const materialsOk = params.materialsIncludedOnly ? isIncludedFlag(r.materials_included) : true;
      return categoryOk && procedureOk && vatOk && anesthesiaOk && materialsOk;
    })
    .sort((a, b) => a.price_min - b.price_min);

  if (filtered.length === 0) return null;

  return {
    resolved,
    items: filtered.map(rowToCard),
    summary: buildSummaryFromRows(filtered),
  };
}

export function queryPriceQuote(params: {
  category?: string;
  procedureName?: string;
  region?: string;
  hospitalName?: string;
  priceMin?: number;
  priceMax?: number;
}): PriceQuoteResult | null {
  const rows = loadRows();
  if (rows.length === 0) return null;

  const filtered = rows.filter((r) => {
    const categoryOk = params.category
      ? r.category.includes(params.category)
      : true;
    const procedureOk = params.procedureName
      ? r.procedure_name.includes(params.procedureName)
      : true;
    const regionOk = params.region ? r.region.includes(params.region) : true;
    const hospitalOk = params.hospitalName ? r.hospital_name.includes(params.hospitalName) : true;
    const minBudgetOk = typeof params.priceMin === "number" ? r.price_max >= params.priceMin : true;
    const maxBudgetOk = typeof params.priceMax === "number" ? r.price_min <= params.priceMax : true;
    return categoryOk && procedureOk && regionOk && hospitalOk && minBudgetOk && maxBudgetOk;
  });

  if (filtered.length === 0) return null;
  const minPrice = Math.min(...filtered.map((r) => r.price_min));
  const maxPrice = Math.max(...filtered.map((r) => r.price_max));
  const vatIncludedCount = filtered.filter((r) =>
    String(r.vat_included).toLowerCase().startsWith("y")
  ).length;
  const anesthesiaIncludedCount = filtered.filter((r) =>
    String(r.anesthesia_included).toLowerCase().startsWith("y")
  ).length;
  const materialsIncludedCount = filtered.filter((r) =>
    String(r.materials_included).toLowerCase().startsWith("y")
  ).length;

  return {
    count: filtered.length,
    min_price: minPrice,
    max_price: maxPrice,
    vat_included_ratio: vatIncludedCount / filtered.length,
    anesthesia_included_ratio: anesthesiaIncludedCount / filtered.length,
    materials_included_ratio: materialsIncludedCount / filtered.length,
    matched_procedures: Array.from(new Set(filtered.map((r) => r.procedure_name))).slice(0, 5),
    matched_regions: Array.from(new Set(filtered.map((r) => r.region))).slice(0, 5),
    matched_hospitals: Array.from(new Set(filtered.map((r) => r.hospital_name))).slice(0, 5),
    sample_remarks: Array.from(
      new Set(filtered.map((r) => r.remarks).filter(Boolean))
    ).slice(0, 3),
  };
}

