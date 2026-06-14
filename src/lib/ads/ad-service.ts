import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase/admin";
import { AD_PLACEMENT_CATALOG } from "@/features/ads/constants/placements";
import type {
  AdPlacement,
  AdPlacementId,
  UpdateAdPlacementRequest,
} from "@/features/ads/types/ad.types";
import placementsSeed from "../../../data/ads/placements.json";

const PLACEMENTS_FILE = path.join(process.cwd(), "data/ads/placements.json");

function isDbConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY),
  );
}

function defaultPlacements(): AdPlacement[] {
  return AD_PLACEMENT_CATALOG.map((meta) => {
    const seed = (placementsSeed as AdPlacement[]).find((s) => s.id === meta.id);
    return {
      id: meta.id,
      label: meta.label,
      description: meta.description,
      is_enabled: seed?.is_enabled ?? false,
      media_type: seed?.media_type ?? null,
      media_url: seed?.media_url ?? null,
      click_url: seed?.click_url ?? null,
      alt_text: seed?.alt_text ?? null,
      updated_at: seed?.updated_at ?? null,
    };
  });
}

function readPlacementsFile(): AdPlacement[] {
  try {
    const raw = readFileSync(PLACEMENTS_FILE, "utf8");
    const parsed = JSON.parse(raw) as AdPlacement[];
    const defaults = defaultPlacements();
    return defaults.map((d) => {
      const found = parsed.find((p) => p.id === d.id);
      return found ? { ...d, ...found, label: d.label, description: d.description } : d;
    });
  } catch {
    return defaultPlacements();
  }
}

function writePlacementsFile(placements: AdPlacement[]): void {
  writeFileSync(PLACEMENTS_FILE, `${JSON.stringify(placements, null, 2)}\n`, "utf8");
}

function rowToPlacement(row: Record<string, unknown>): AdPlacement {
  const meta = AD_PLACEMENT_CATALOG.find((m) => m.id === row.id);
  return {
    id: row.id as AdPlacementId,
    label: (row.label as string) ?? meta?.label ?? String(row.id),
    description: (row.description as string) ?? meta?.description ?? "",
    is_enabled: Boolean(row.is_enabled),
    media_type: (row.media_type as AdPlacement["media_type"]) ?? null,
    media_url: (row.media_url as string | null) ?? null,
    click_url: (row.click_url as string | null) ?? null,
    alt_text: (row.alt_text as string | null) ?? null,
    updated_at: (row.updated_at as string | null) ?? null,
  };
}

export async function listAllAdPlacements(): Promise<AdPlacement[]> {
  if (!isDbConfigured()) {
    return readPlacementsFile();
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("ad_placements").select("*");

    if (error) throw error;

    const defaults = defaultPlacements();
    if (!data?.length) return defaults;

    return defaults.map((d) => {
      const row = data.find((r) => r.id === d.id);
      return row ? rowToPlacement(row as Record<string, unknown>) : d;
    });
  } catch (err) {
    console.error("[listAllAdPlacements] fallback to file:", err);
    return readPlacementsFile();
  }
}

/** 앱 노출용 — enabled + media_url 있는 슬롯만 */
export async function listActiveAdPlacements(): Promise<AdPlacement[]> {
  const all = await listAllAdPlacements();
  return all.filter((p) => p.is_enabled && p.media_url?.trim());
}

export async function updateAdPlacement(
  id: AdPlacementId,
  patch: UpdateAdPlacementRequest,
): Promise<AdPlacement> {
  const now = new Date().toISOString();
  const all = await listAllAdPlacements();
  const current = all.find((p) => p.id === id);
  if (!current) throw new Error("NOT_FOUND");

  const next: AdPlacement = {
    ...current,
    ...patch,
    updated_at: now,
  };

  if (next.is_enabled && !next.media_url?.trim()) {
    throw new Error("MEDIA_REQUIRED");
  }

  if (isDbConfigured()) {
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from("ad_placements")
        .upsert(
          {
            id: next.id,
            label: next.label,
            description: next.description,
            is_enabled: next.is_enabled,
            media_type: next.media_type,
            media_url: next.media_url,
            click_url: next.click_url,
            alt_text: next.alt_text,
            updated_at: now,
          },
          { onConflict: "id" },
        )
        .select("*")
        .single();

      if (error) throw error;
      return rowToPlacement(data as Record<string, unknown>);
    } catch (err) {
      console.error("[updateAdPlacement] db error, file fallback:", err);
    }
  }

  const updated = all.map((p) => (p.id === id ? next : p));
  writePlacementsFile(updated);
  return next;
}
