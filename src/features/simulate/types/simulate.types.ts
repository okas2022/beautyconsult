export type ProcedureType = "eyes" | "nose" | "breast";

export interface SimulateRequest {
  imageBase64: string;
  mimeType?: string;
  procedure: ProcedureType;
  /** 0 (minimal) ~ 100 (maximum) */
  intensity: number;
}

export interface SimulateResponse {
  beforeImage: string;
  afterImage: string;
  procedure: ProcedureType;
  intensity: number;
  prompt: string;
  strength: number;
  source: "replicate" | "demo";
}

export interface SimulateErrorResponse {
  error: string;
  code?: "FACE_NOT_DETECTED" | "RATE_LIMIT" | "CONFIG" | "GENERATION_FAILED";
}

export const PROCEDURE_LABELS: Record<ProcedureType, string> = {
  eyes: "눈 (쌍꺼풀)",
  nose: "코",
  breast: "가슴 (볼륨)",
};

export const INTENSITY_LABELS: Record<
  ProcedureType,
  { min: string; max: string; unit?: string }
> = {
  eyes: { min: "자연스럽게", max: "화려하게" },
  nose: { min: "은은하게", max: "뚜렷하게" },
  breast: { min: "250cc", max: "400cc", unit: "cc" },
};
