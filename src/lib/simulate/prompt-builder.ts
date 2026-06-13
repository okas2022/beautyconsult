import type { ProcedureType } from "@/features/simulate/types/simulate.types";

export interface SimulationPrompts {
  prompt: string;
  negativePrompt: string;
  strength: number;
  displayValue: string;
}

const NEGATIVE_BASE =
  "deformed, ugly, blurry, low quality, cartoon, anime, different person, asymmetry, scars, watermark, text";

function lerp(min: number, max: number, t: number): number {
  return min + (max - min) * t;
}

function intensityNorm(intensity: number): number {
  return Math.min(100, Math.max(0, intensity)) / 100;
}

export function buildSimulationPrompts(
  procedure: ProcedureType,
  intensity: number,
): SimulationPrompts {
  const t = intensityNorm(intensity);

  switch (procedure) {
    case "eyes": {
      const style =
        t < 0.33
          ? "subtle natural inward double eyelid, minimal crease"
          : t < 0.66
            ? "defined semi-out double eyelid, balanced eye shape"
            : "clear outward double eyelid, bright open eyes";
      return {
        prompt: `professional portrait photo, same person, ${style}, symmetric eyes, realistic skin texture, natural lighting, high detail`,
        negativePrompt: `${NEGATIVE_BASE}, extra eyelids, crossed eyes, unnatural crease`,
        strength: lerp(0.32, 0.58, t),
        displayValue: t < 0.33 ? "자연 인아웃" : t < 0.66 ? "세미아웃" : "뚜렷한 아웃라인",
      };
    }
    case "nose": {
      const style =
        t < 0.33
          ? "subtle refined nose bridge, natural nostrils"
          : t < 0.66
            ? "straight defined nose bridge, balanced tip"
            : "sculpted nose bridge, refined tip, elegant profile";
      return {
        prompt: `professional portrait photo, same person, ${style}, realistic skin, soft shadows, photorealistic`,
        negativePrompt: `${NEGATIVE_BASE}, crooked nose, bulbous tip, unnatural nostrils`,
        strength: lerp(0.35, 0.62, t),
        displayValue: t < 0.33 ? "은은한 코 라인" : t < 0.66 ? "균형 잡힌 콧대" : "뚜렷한 프로필",
      };
    }
    case "breast": {
      const cc = Math.round(lerp(250, 400, t));
      const style =
        t < 0.33
          ? "subtle natural upper body proportion"
          : t < 0.66
            ? "balanced natural volume, elegant silhouette"
            : " fuller natural volume, smooth contour";
      return {
        prompt: `professional portrait photo, same person, ${style}, realistic body proportion, natural skin, modest clothing, high quality`,
        negativePrompt: `${NEGATIVE_BASE}, nude, explicit, unnatural proportions, extra limbs`,
        strength: lerp(0.38, 0.68, t),
        displayValue: `${cc}cc`,
      };
    }
    default:
      return {
        prompt: "professional portrait photo, same person, natural enhancement, photorealistic",
        negativePrompt: NEGATIVE_BASE,
        strength: 0.45,
        displayValue: "기본",
      };
  }
}
