import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;

  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuf = Buffer.from(hash, "hex");
  if (derived.length !== hashBuf.length) return false;

  return timingSafeEqual(derived, hashBuf);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "비밀번호는 8자 이상 입력해 주세요.";
  }
  if (password.length > 72) {
    return "비밀번호는 72자 이하로 입력해 주세요.";
  }
  return null;
}
