import { createAdminClient } from "@/lib/supabase/admin";
import type {
  CreateLeadRequest,
  Lead,
  LeadStatus,
} from "@/features/leads/types/lead.types";
import { DEFAULT_HOSPITAL_ID } from "@/features/leads/types/lead.types";
import { summarizeConsultation } from "@/lib/leads/summarize-consultation";

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

function isValidPhone(phone: string): boolean {
  const digits = normalizePhone(phone);
  return digits.length >= 10 && digits.length <= 13;
}

export async function createLead(input: CreateLeadRequest): Promise<Lead> {
  const phone = normalizePhone(input.phone_number);
  if (!isValidPhone(phone)) {
    throw new Error("INVALID_PHONE");
  }

  const summary = await summarizeConsultation(
    input.messages ?? [],
    input.video_title,
  );

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      patient_id: input.patient_id,
      hospital_id: input.hospital_id ?? DEFAULT_HOSPITAL_ID,
      phone_number: phone,
      consultation_summary: summary,
      status: "pending",
      video_id: input.video_id ?? null,
      video_title: input.video_title ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[createLead] db error:", error);
    throw new Error("DB_ERROR");
  }

  return data as Lead;
}

export async function listLeads(hospitalId?: string): Promise<Lead[]> {
  const supabase = createAdminClient();
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (hospitalId) {
    query = query.eq("hospital_id", hospitalId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[listLeads] db error:", error);
    throw new Error("DB_ERROR");
  }

  return (data ?? []) as Lead[];
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<Lead> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("leads")
    .update({ status })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("[updateLeadStatus] db error:", error);
    throw new Error("DB_ERROR");
  }

  return data as Lead;
}
