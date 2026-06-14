export interface SynonymEntry {
  /** 환자가 실제로 쓰는 검색어 */
  aliases: string[];
  category: string;
  /** UI에 보여줄 중분류 라벨 */
  subcategory: string;
  /** DB procedure_name 매칭 키워드 */
  procedureKeywords: string[];
}

/** 의료-일상어 사전: 환자 검색어 → 표준 카테고리/시술 키워드 */
export const NONCOVERED_SYNONYM_MAP: SynonymEntry[] = [
  {
    aliases: ["쌍수", "쌍꺼풀", "쌍커풀", "인아웃", "매몰", "절개쌍꺼풀"],
    category: "눈",
    subcategory: "쌍꺼풀",
    procedureKeywords: ["쌍꺼풀"],
  },
  {
    aliases: ["앞트임", "뒤트임", "밑트임", "트임", "위트임"],
    category: "눈",
    subcategory: "트임",
    procedureKeywords: ["트임", "쌍꺼풀"],
  },
  {
    aliases: ["눈밑지", "눈밑지방", "눈밑지재", "눈밑지방재배치", "다크서클", "눈밑"],
    category: "눈",
    subcategory: "눈밑지방재배치",
    procedureKeywords: ["눈밑지방재배치"],
  },
  {
    aliases: ["상안검", "하안검", "눈꺼풀처짐", "중년눈"],
    category: "눈",
    subcategory: "상안검/하안검",
    procedureKeywords: ["상안검", "하안검"],
  },
  {
    aliases: ["눈매교정", "안검하수", "눈뜨는힘"],
    category: "눈",
    subcategory: "눈매교정",
    procedureKeywords: ["쌍꺼풀", "상안검"],
  },
  {
    aliases: ["코성형", "콧대", "코끝", "낮은코", "낮은콧대"],
    category: "코",
    subcategory: "콧대/코끝",
    procedureKeywords: ["코성형", "콧대"],
  },
  {
    aliases: ["매부리코", "매부리", "휜코", "복코"],
    category: "코",
    subcategory: "특수코",
    procedureKeywords: ["매부리", "코성형"],
  },
  {
    aliases: ["코재수술", "재코", "코재"],
    category: "코",
    subcategory: "코 재수술",
    procedureKeywords: ["코 재수술"],
  },
  {
    aliases: ["가슴확대", "가슴수술", "가슴", "보형물"],
    category: "가슴",
    subcategory: "가슴확대",
    procedureKeywords: ["가슴확대"],
  },
  {
    aliases: ["모티바", "모타바", "motiva"],
    category: "가슴",
    subcategory: "가슴확대(모티바)",
    procedureKeywords: ["모티바"],
  },
  {
    aliases: ["멘토", "멘토엑스트라", "mentor"],
    category: "가슴",
    subcategory: "가슴확대(멘토)",
    procedureKeywords: ["멘토"],
  },
  {
    aliases: ["가슴지방이식", "가슴지이식"],
    category: "가슴",
    subcategory: "가슴 지방이식",
    procedureKeywords: ["가슴 지방이식"],
  },
  {
    aliases: ["윤곽", "광대", "사각턱", "턱끝", "안면윤곽"],
    category: "윤곽",
    subcategory: "안면윤곽",
    procedureKeywords: ["안면윤곽"],
  },
  {
    aliases: ["지방흡입", "복부지흡", "복지흡", "팔지흡", "허벅지지흡"],
    category: "체형",
    subcategory: "지방흡입",
    procedureKeywords: ["지방흡입"],
  },
  {
    aliases: ["보톡스", "사각턱보톡스", "제오민", "주름보톡스"],
    category: "쁘띠",
    subcategory: "보톡스",
    procedureKeywords: ["보톡스"],
  },
  {
    aliases: ["필러", "입꼬필", "입술필러", "팔자필러", "이마필러", "코필러"],
    category: "쁘띠",
    subcategory: "필러",
    procedureKeywords: ["필러"],
  },
  {
    aliases: ["실리프팅", "민트실", "실리프트"],
    category: "리프팅",
    subcategory: "실리프팅",
    procedureKeywords: ["실리프팅"],
  },
  {
    aliases: ["안면거상", "풀페이스거상", "거상"],
    category: "리프팅",
    subcategory: "안면거상",
    procedureKeywords: ["안면거상"],
  },
  {
    aliases: ["울쎄라", "울세라", "울쎄라300", "울쎄라 300", "ulthera"],
    category: "리프팅",
    subcategory: "울쎄라",
    procedureKeywords: ["울쎄라"],
  },
  {
    aliases: ["써마지", "thermage", "인모드", "슈링크"],
    category: "리프팅",
    subcategory: "레이저 리프팅",
    procedureKeywords: ["울쎄라", "리프팅"],
  },
  {
    aliases: ["쥬베룩", "스킨부스터", "리쥬란"],
    category: "피부",
    subcategory: "스킨부스터",
    procedureKeywords: ["쥬베룩"],
  },
];

export interface ResolvedSearchQuery {
  raw: string;
  category?: string;
  subcategory?: string;
  procedureKeywords: string[];
  matchedAlias?: string;
  source: "synonym" | "direct";
}

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, "");
}

export function resolveSearchQuery(input: string): ResolvedSearchQuery {
  const raw = input.trim();
  const compact = normalize(raw);
  if (!compact) {
    return { raw, procedureKeywords: [], source: "direct" };
  }

  let best: { entry: SynonymEntry; alias: string; score: number } | null = null;
  for (const entry of NONCOVERED_SYNONYM_MAP) {
    for (const alias of entry.aliases) {
      const aliasCompact = normalize(alias);
      if (compact === aliasCompact || compact.includes(aliasCompact) || aliasCompact.includes(compact)) {
        const score = aliasCompact.length;
        if (!best || score > best.score) {
          best = { entry, alias, score };
        }
      }
    }
  }

  if (best) {
    return {
      raw,
      category: best.entry.category,
      subcategory: best.entry.subcategory,
      procedureKeywords: best.entry.procedureKeywords,
      matchedAlias: best.alias,
      source: "synonym",
    };
  }

  return {
    raw,
    procedureKeywords: [raw],
    source: "direct",
  };
}

export function getSynonymSuggestions(limit = 8): string[] {
  const popular = [
    "쌍수",
    "눈밑지",
    "모티바",
    "코성형",
    "울쎄라",
    "보톡스",
    "필러",
    "지방흡입",
  ];
  return popular.slice(0, limit);
}
