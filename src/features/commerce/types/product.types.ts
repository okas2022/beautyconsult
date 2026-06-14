export type SymptomKeyword = "건조" | "홍조" | "여드름" | "흉터" | "민감" | "지성" | "모공" | "색소침착" | "탄력" | "각질" | "당김" | "열감";

export interface Product {
  id: string;
  name: string;
  brand?: string;
  price_krw?: number;
  target_symptom: string[];
  url: string;
  image_url: string;
  description?: string;
  is_sponsored?: boolean;
}

export const TRACKED_SYMPTOMS: SymptomKeyword[] = [
  "건조",
  "홍조",
  "여드름",
  "흉터",
];
