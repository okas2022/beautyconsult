import { createAdminClient } from "@/lib/supabase/admin";

export interface AppUser {
  id: string;
  is_premium: boolean;
  premium_since: string | null;
  created_at: string;
}

export async function getOrCreateUser(userId: string): Promise<AppUser> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (existing) return existing as AppUser;

  const { data, error } = await supabase
    .from("users")
    .insert({ id: userId, is_premium: false })
    .select("*")
    .single();

  if (error) {
    console.error("[getOrCreateUser] error:", error);
    throw new Error("DB_ERROR");
  }

  return data as AppUser;
}

export async function isUserPremium(userId: string): Promise<boolean> {
  try {
    const user = await getOrCreateUser(userId);
    return user.is_premium;
  } catch {
    return false;
  }
}

export async function activatePremium(userId: string): Promise<AppUser> {
  const supabase = createAdminClient();
  await getOrCreateUser(userId);

  const { data, error } = await supabase
    .from("users")
    .update({
      is_premium: true,
      premium_since: new Date().toISOString(),
    })
    .eq("id", userId)
    .select("*")
    .single();

  if (error) throw new Error("DB_ERROR");
  return data as AppUser;
}
