import fs from "fs";
import path from "path";
import type { Product } from "@/features/commerce/types/product.types";

let cache: Product[] | null = null;

export function loadProducts(): Product[] {
  if (cache) return cache;
  const filePath = path.join(process.cwd(), "products.json");
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    cache = JSON.parse(raw) as Product[];
    return cache;
  } catch {
    return [];
  }
}

export function matchProductsBySymptoms(symptoms: string[]): Product[] {
  if (!symptoms.length) return [];

  const products = loadProducts();
  const normalized = symptoms.map((s) => s.trim()).filter(Boolean);

  const scored = products
    .map((product) => {
      const overlap = product.target_symptom.filter((t) =>
        normalized.some((s) => t.includes(s) || s.includes(t)),
      );
      return { product, score: overlap.length };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const results: Product[] = [];
  for (const { product } of scored) {
    if (seen.has(product.id)) continue;
    seen.add(product.id);
    results.push(product);
    if (results.length >= 2) break;
  }
  return results;
}

/** 사용자 메시지에서 증상 키워드 휴리스틱 추출 (fallback) */
export function detectSymptomsFromText(text: string): string[] {
  const rules: Array<{ keyword: string; patterns: RegExp[] }> = [
    { keyword: "건조", patterns: [/건조/, /당김/, /각질/, /속건조/] },
    { keyword: "홍조", patterns: [/홍조/, /붉/, /빨/, /열감/] },
    { keyword: "여드름", patterns: [/여드름/, /트러블/, /뾰루지/, /피지/] },
    { keyword: "흉터", patterns: [/흉터/, /자국/, /색소/, /잡티/] },
  ];

  const found: string[] = [];
  for (const { keyword, patterns } of rules) {
    if (patterns.some((p) => p.test(text))) found.push(keyword);
  }
  return found;
}
