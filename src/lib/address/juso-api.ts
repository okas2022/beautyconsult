import type { JusoAddressItem } from "@/features/auth/types/auth.types";

const JUSO_API = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

function getJusoKey(): string {
  return (
    process.env.JUSO_CONFM_KEY ??
    process.env.NEXT_PUBLIC_JUSO_CONFM_KEY ??
    "U01TX0FVVEgyMDI2MDUxNzIyMzI1NTExODE3OTc="
  );
}

export async function searchRoadAddress(
  keyword: string,
  page = 1,
): Promise<{ items: JusoAddressItem[]; total: number }> {
  const q = keyword.trim();
  if (q.length < 2) {
    return { items: [], total: 0 };
  }

  const params = new URLSearchParams({
    confmKey: getJusoKey(),
    currentPage: String(page),
    countPerPage: "10",
    keyword: q,
    resultType: "json",
  });

  const res = await fetch(`${JUSO_API}?${params.toString()}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error("JUSO_HTTP_ERROR");
  }

  const data = (await res.json()) as {
    results?: {
      common?: { errorCode?: string; errorMessage?: string; totalCount?: string };
      juso?: Array<{
        roadAddr?: string;
        jibunAddr?: string;
        zipNo?: string;
        bdNm?: string;
      }>;
    };
  };

  const common = data.results?.common;
  if (common?.errorCode !== "0") {
    console.error("[searchRoadAddress]", common?.errorMessage);
    throw new Error(common?.errorMessage ?? "JUSO_ERROR");
  }

  const items: JusoAddressItem[] = (data.results?.juso ?? []).map((j) => ({
    roadAddr: j.roadAddr ?? "",
    jibunAddr: j.jibunAddr ?? "",
    zipNo: j.zipNo ?? "",
    bdNm: j.bdNm,
  }));

  return {
    items,
    total: Number(common?.totalCount ?? items.length),
  };
}
