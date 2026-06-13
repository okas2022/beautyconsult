import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_HOSPITAL_ID } from "@/features/leads/types/lead.types";
import {
  getHospitalCatalogEntry,
} from "@/features/hospitals/constants/hospitals";
import { hospitalKnowledgeFileExists } from "@/lib/knowledge/hospital-knowledge-files";
import type {
  Hospital,
  HospitalVideo,
  VideoTranscriptSegment,
} from "@/features/hospitals/types/hospital.types";
import {
  buildYoutubeUrl,
  fetchYoutubeTitle,
  fetchYoutubeTranscripts,
  parseYoutubeVideoId,
} from "@/lib/youtube/transcript";

export async function getHospital(hospitalId: string): Promise<Hospital | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hospitals")
    .select("*")
    .eq("id", hospitalId)
    .maybeSingle();

  if (error) {
    console.error("[getHospital] error:", error);
    return null;
  }
  return data as Hospital | null;
}

export async function isHospitalSubscribed(hospitalId: string): Promise<boolean> {
  try {
    const hospital = await getHospital(hospitalId);
    if (hospital) return Boolean(hospital.is_subscribed);
  } catch {
    /* DB unavailable — fall through */
  }

  const catalog = getHospitalCatalogEntry(hospitalId);
  if (catalog?.isSubscribed && hospitalKnowledgeFileExists(hospitalId)) {
    return true;
  }

  return Boolean(catalog?.isSubscribed);
}

export async function listHospitalVideos(
  hospitalId: string,
): Promise<HospitalVideo[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hospital_videos")
    .select("*")
    .eq("hospital_id", hospitalId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listHospitalVideos] error:", error);
    throw new Error("DB_ERROR");
  }

  return (data ?? []).map(normalizeHospitalVideo);
}

export async function addHospitalVideo(
  hospitalId: string,
  youtubeUrl: string,
): Promise<HospitalVideo> {
  const videoId = parseYoutubeVideoId(youtubeUrl);
  if (!videoId) throw new Error("INVALID_URL");

  const hospital = await getHospital(hospitalId);
  if (!hospital) throw new Error("HOSPITAL_NOT_FOUND");
  if (!hospital.is_subscribed) throw new Error("NOT_SUBSCRIBED");

  const title = await fetchYoutubeTitle(videoId);
  const transcripts = await fetchYoutubeTranscripts(videoId, title);
  const url = buildYoutubeUrl(videoId);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("hospital_videos")
    .upsert(
      {
        video_id: videoId,
        hospital_id: hospitalId,
        title,
        url,
        transcripts,
      },
      { onConflict: "hospital_id,video_id" },
    )
    .select("*")
    .single();

  if (error) {
    console.error("[addHospitalVideo] error:", error);
    throw new Error("DB_ERROR");
  }

  return normalizeHospitalVideo(data);
}

export async function deleteHospitalVideo(
  id: string,
  hospitalId: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("hospital_videos")
    .delete()
    .eq("id", id)
    .eq("hospital_id", hospitalId);

  if (error) throw new Error("DB_ERROR");
}

export async function loadSubscribedVideosForRag(
  hospitalId: string = DEFAULT_HOSPITAL_ID,
): Promise<HospitalVideo[]> {
  const subscribed = await isHospitalSubscribed(hospitalId);
  if (!subscribed) return [];
  return listHospitalVideos(hospitalId);
}

function normalizeHospitalVideo(row: Record<string, unknown>): HospitalVideo {
  return {
    id: String(row.id),
    video_id: String(row.video_id),
    hospital_id: String(row.hospital_id),
    title: row.title ? String(row.title) : null,
    url: String(row.url),
    transcripts: Array.isArray(row.transcripts)
      ? (row.transcripts as VideoTranscriptSegment[])
      : [],
    created_at: String(row.created_at),
  };
}
