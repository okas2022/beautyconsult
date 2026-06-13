import sharp from "sharp";
import type { ProcedureType } from "@/features/simulate/types/simulate.types";

/** PoC: 얼굴/부위 중앙 타원형 더미 마스크 (OpenCV 대체) */
export async function createDummyInpaintMask(
  width: number,
  height: number,
  procedure: ProcedureType,
): Promise<string> {
  const cx = width / 2;
  const cy = procedure === "breast" ? height * 0.62 : height * 0.42;
  const rx = procedure === "breast" ? width * 0.28 : width * 0.22;
  const ry = procedure === "breast" ? height * 0.18 : height * 0.14;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="black"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="white"/>
    </svg>`;

  const buffer = await sharp(Buffer.from(svg)).png().toBuffer();
  return buffer.toString("base64");
}

export async function getImageDimensions(
  imageBase64: string,
): Promise<{ width: number; height: number }> {
  const buffer = Buffer.from(imageBase64, "base64");
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width ?? 512,
    height: meta.height ?? 512,
  };
}
