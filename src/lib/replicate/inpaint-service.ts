import Replicate from "replicate";
import {
  createDummyInpaintMask,
  getImageDimensions,
} from "@/lib/simulate/dummy-mask";
import { buildSimulationPrompts } from "@/lib/simulate/prompt-builder";
import type { ProcedureType } from "@/features/simulate/types/simulate.types";

const DEFAULT_MODEL =
  "stability-ai/stable-diffusion-inpainting:95b72231041324064a5f909a2412a626986e4ef7346521225a0dbe577843824d";

export interface InpaintInput {
  imageBase64: string;
  mimeType: string;
  procedure: ProcedureType;
  intensity: number;
}

export interface InpaintResult {
  afterImageBase64: string;
  prompt: string;
  strength: number;
  source: "replicate" | "demo";
}

export function isReplicateConfigured(): boolean {
  return Boolean(process.env.REPLICATE_API_TOKEN);
}

function mapReplicateError(message: string): { error: string; code?: string } {
  const lower = message.toLowerCase();
  if (/rate limit|429|too many requests/.test(lower)) {
    return {
      error: "API 사용 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.",
      code: "RATE_LIMIT",
    };
  }
  if (/face|detect|no person/.test(lower)) {
    return {
      error: "얼굴을 인식하지 못했습니다. 정면 사진을 다시 업로드해 주세요.",
      code: "FACE_NOT_DETECTED",
    };
  }
  return {
    error: "이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    code: "GENERATION_FAILED",
  };
}

async function runReplicateInpaint(
  imageDataUri: string,
  maskDataUri: string,
  prompt: string,
  negativePrompt: string,
  strength: number,
): Promise<string> {
  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) throw new Error("REPLICATE_API_TOKEN is not configured");

  const replicate = new Replicate({ auth: token });
  const model = (process.env.REPLICATE_INPAINT_MODEL?.trim() ||
    DEFAULT_MODEL) as `${string}/${string}:${string}`;

  const output = (await replicate.run(model, {
    input: {
      image: imageDataUri,
      mask: maskDataUri,
      prompt,
      negative_prompt: negativePrompt,
      prompt_strength: strength,
      num_inference_steps: 30,
      guidance_scale: 7.5,
    },
  })) as string | string[] | null;

  const url = Array.isArray(output) ? output[0] : output;
  if (!url || typeof url !== "string") {
    throw new Error("Replicate returned no output image");
  }

  const imgRes = await fetch(url);
  if (!imgRes.ok) {
    throw new Error(`Failed to fetch output image: ${imgRes.status}`);
  }
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  return buffer.toString("base64");
}

/** PoC demo: 원본 반환 (API 키 없을 때 UI 플로우 검증용) */
async function runDemoInpaint(imageBase64: string): Promise<string> {
  return imageBase64;
}

export async function generateInpaintSimulation(
  input: InpaintInput,
): Promise<InpaintResult> {
  const { prompt, negativePrompt, strength } = buildSimulationPrompts(
    input.procedure,
    input.intensity,
  );

  if (!isReplicateConfigured()) {
    const after = await runDemoInpaint(input.imageBase64);
    return {
      afterImageBase64: after,
      prompt,
      strength,
      source: "demo",
    };
  }

  try {
    const { width, height } = await getImageDimensions(input.imageBase64);
    const maskBase64 = await createDummyInpaintMask(
      width,
      height,
      input.procedure,
    );

    const imageDataUri = `data:${input.mimeType};base64,${input.imageBase64}`;
    const maskDataUri = `data:image/png;base64,${maskBase64}`;

    const afterImageBase64 = await runReplicateInpaint(
      imageDataUri,
      maskDataUri,
      prompt,
      negativePrompt,
      strength,
    );

    return {
      afterImageBase64,
      prompt,
      strength,
      source: "replicate",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const mapped = mapReplicateError(message);
    throw new Error(JSON.stringify(mapped));
  }
}

export function parseSimulateError(error: unknown): {
  error: string;
  code?: string;
} {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as {
        error: string;
        code?: string;
      };
      if (parsed.error) return parsed;
    } catch {
      return mapReplicateError(error.message);
    }
  }
  return {
    error: "알 수 없는 오류가 발생했습니다.",
    code: "GENERATION_FAILED",
  };
}
