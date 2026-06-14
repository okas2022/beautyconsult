import { randomUUID } from "crypto";
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from "@/lib/auth/password";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateUser } from "@/lib/users/user-service";
import type {
  LoginPayload,
  MemberProfile,
  SignupPayload,
} from "@/features/auth/types/auth.types";

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

function rowToMember(row: Record<string, unknown>): MemberProfile {
  return {
    id: String(row.id),
    full_name: String(row.full_name),
    birth_yymmdd: String(row.birth_yymmdd),
    birth_gender_digit: String(row.birth_gender_digit),
    road_address: String(row.road_address),
    road_address_detail: (row.road_address_detail as string | null) ?? null,
    zip_code: (row.zip_code as string | null) ?? null,
    phone_number: String(row.phone_number),
    usage_purpose: String(row.usage_purpose),
    is_guest: Boolean(row.is_guest),
    guest_chat_count: Number(row.guest_chat_count ?? 0),
    created_at: String(row.created_at),
  };
}

export function validateSignupPayload(payload: SignupPayload): string | null {
  if (!payload.full_name.trim() || payload.full_name.trim().length < 2) {
    return "이름을 2자 이상 입력해 주세요.";
  }
  const passwordErr = validatePasswordStrength(payload.password ?? "");
  if (passwordErr) return passwordErr;
  if (!/^\d{6}$/.test(payload.birth_yymmdd)) {
    return "생년월일 6자리(주민번호 앞자리)를 입력해 주세요.";
  }
  if (!/^[1-4]$/.test(payload.birth_gender_digit)) {
    return "주민번호 뒷자리 첫 번째 숫자(1~4)를 입력해 주세요.";
  }
  if (!payload.road_address.trim()) {
    return "도로명 주소를 검색해 선택해 주세요.";
  }
  const phone = normalizePhone(payload.phone_number);
  if (!/^01[016789]\d{7,8}$/.test(phone)) {
    return "올바른 휴대폰 번호를 입력해 주세요.";
  }
  if (!payload.usage_purpose.trim()) {
    return "사용 목적을 선택해 주세요.";
  }
  return null;
}

export function validateLoginPayload(payload: LoginPayload): string | null {
  if (!payload.full_name.trim() || payload.full_name.trim().length < 2) {
    return "이름을 입력해 주세요.";
  }
  if (!payload.password) {
    return "비밀번호를 입력해 주세요.";
  }
  return null;
}

export async function signupMember(
  payload: SignupPayload,
  existingId?: string,
): Promise<MemberProfile> {
  const err = validateSignupPayload(payload);
  if (err) throw new Error(err);

  const phone = normalizePhone(payload.phone_number);
  const id = existingId ?? randomUUID();
  const supabase = createAdminClient();
  const passwordHash = await hashPassword(payload.password);

  const { data: existingPhone } = await supabase
    .from("member_profiles")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle();

  if (existingPhone && existingPhone.id !== id) {
    throw new Error("PHONE_EXISTS");
  }

  const now = new Date().toISOString();
  const row = {
    id,
    full_name: payload.full_name.trim(),
    birth_yymmdd: payload.birth_yymmdd,
    birth_gender_digit: payload.birth_gender_digit,
    road_address: payload.road_address.trim(),
    road_address_detail: payload.road_address_detail?.trim() || null,
    zip_code: payload.zip_code?.trim() || null,
    phone_number: phone,
    usage_purpose: payload.usage_purpose.trim(),
    password_hash: passwordHash,
    is_guest: false,
    guest_chat_count: 0,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("member_profiles")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("PHONE_EXISTS");
    console.error("[signupMember]", error);
    throw new Error("DB_ERROR");
  }

  await getOrCreateUser(id);
  return rowToMember(data as Record<string, unknown>);
}

export async function loginMember(payload: LoginPayload): Promise<MemberProfile> {
  const err = validateLoginPayload(payload);
  if (err) throw new Error(err);

  const supabase = createAdminClient();
  const name = payload.full_name.trim();

  const { data, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("full_name", name)
    .eq("is_guest", false);

  if (error) {
    console.error("[loginMember]", error);
    throw new Error("DB_ERROR");
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  if (rows.length === 0) throw new Error("NOT_FOUND");

  for (const row of rows) {
    const storedHash = row.password_hash as string | null | undefined;
    if (!storedHash) continue;
    const valid = await verifyPassword(payload.password, storedHash);
    if (valid) {
      return rowToMember(row);
    }
  }

  throw new Error("NOT_FOUND");
}

export async function getMemberById(id: string): Promise<MemberProfile | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("member_profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return rowToMember(data as Record<string, unknown>);
}

export async function createGuestMember(): Promise<MemberProfile> {
  const id = randomUUID();
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const row = {
    id,
    full_name: "둘러보기",
    birth_yymmdd: "000000",
    birth_gender_digit: "0",
    road_address: "-",
    phone_number: `guest-${id.slice(0, 8)}`,
    usage_purpose: "둘러보기",
    is_guest: true,
    guest_chat_count: 0,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("member_profiles")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    console.error("[createGuestMember]", error);
    throw new Error("DB_ERROR");
  }

  await getOrCreateUser(id);
  return rowToMember(data as Record<string, unknown>);
}

export async function incrementGuestChatCount(memberId: string): Promise<number> {
  const supabase = createAdminClient();
  const member = await getMemberById(memberId);
  if (!member?.is_guest) return 0;

  const next = member.guest_chat_count + 1;
  await supabase
    .from("member_profiles")
    .update({ guest_chat_count: next, updated_at: new Date().toISOString() })
    .eq("id", memberId);

  return next;
}
