import type { ConsultPriceContext } from "@/lib/consult-gemini";
import { searchNoncoveredPrices } from "@/lib/noncovered-pricing";

const PRICE_QUERY =
  /비용|가격|얼마|견적|부담|원\s*정도|만\s*원|price|cost/i;

export function isPriceRelatedQuery(text: string): boolean {
  return PRICE_QUERY.test(text);
}

export function resolvePriceContextForQuery(
  text: string,
): ConsultPriceContext | undefined {
  if (!isPriceRelatedQuery(text)) return undefined;

  const result = searchNoncoveredPrices({ q: text });
  if (!result?.summary.count) return undefined;

  return {
    count: result.summary.count,
    min_price: result.summary.min_price,
    max_price: result.summary.max_price,
    matched_label: result.resolved.subcategory ?? result.resolved.matchedAlias,
    items: result.items.map((item) => ({
      hospital_name: item.hospital_name,
      procedure_name: item.procedure_name,
      price_min: item.price_min,
      price_max: item.price_max,
      badges: item.badges,
      remarks: item.remarks,
    })),
  };
}
