import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from "@google/genai";
import {
  assembleConsultPrompt,
  buildSessionContextBlock,
  CONSULT_PERSONA,
  retrieveRagContext,
  type RagRetrievalResult,
} from "./consult-context-pipeline";
import type { YoutubeVideoRef } from "./youtube-rag";

export type ConsultIntent = "qa" | "analysis" | "booking" | "price" | "select_procedure";

export interface ConsultChatMessage {
  role: "user" | "agent";
  content: string;
}

export interface ConsultPriceContextItem {
  hospital_name: string;
  procedure_name: string;
  price_min: number;
  price_max: number;
  badges?: Array<{ label: string }>;
  remarks?: string;
}

export interface ConsultPriceContext {
  count: number;
  min_price: number;
  max_price: number;
  items: ConsultPriceContextItem[];
  matched_label?: string;
}

export interface ConsultChatInput {
  userText: string;
  hospitalId?: string;
  category?: string;
  procedureName?: string;
  concernTags?: string[];
  hasAnalysis?: boolean;
  history?: ConsultChatMessage[];
  priceContext?: ConsultPriceContext;
}

export interface ConsultRagMeta {
  chunkCount: number;
  chunkIds: string[];
  dataSource: "db" | "file";
  searchMethods: Array<"vector_db" | "vector_local" | "lexical">;
}

export interface ConsultChatResult {
  reply: string;
  intent: ConsultIntent;
  category?: string;
  procedureName?: string;
  nextActions?: string[];
  videoRefs?: YoutubeVideoRef[];
  ragUsed?: boolean;
  ragMeta?: ConsultRagMeta;
  source: "gemini" | "fallback";
}

const CONSULT_SAFETY_SETTINGS = [
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_NONE,
  },
];

const VALID_INTENTS: ConsultIntent[] = ["qa", "analysis", "booking", "price", "select_procedure"];

const CONSULT_TEMPERATURE = 0.25;
const CONSULT_TOP_P = 0.85;

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  return new GoogleGenAI({ apiKey });
}

function formatPrice(n: number): string {
  return n.toLocaleString("ko-KR");
}

const FORBIDDEN_REPLY_PATTERNS = [
  /유튜브\s*대본/i,
  /대본\s*데이터/i,
  /데이터에\s*(포함|없)/i,
  /정확한\s*금액.*어렵/i,
  /설명되어\s*있지\s*않/i,
  /영상에\s*(없|포함)/i,
  /대본에\s*없/i,
  /학습\s*영상/i,
  /원장님\s*영상/i,
];

function replyContainsForbiddenMeta(text: string): boolean {
  return FORBIDDEN_REPLY_PATTERNS.some((pattern) => pattern.test(text));
}

function buildEpicanthoplastyPriceFallback(): string {
  return (
    "앞트임 비용 문의 주셔서 감사합니다. 앞트임은 단독으로 진행하기보다 쌍꺼풀·눈매교정과 함께 계획하는 경우가 많아, 조합 시술 여부에 따라 체감 금액이 달라집니다. " +
    "또 마취비·부가세·재료대·봉합·사후관리 항목 포함 여부에 따라 견적이 달라지니, 상담 시 항목별로 꼭 확인해보세요. " +
    "눈 사이 간격·앞쪽 전막(빨간 부분) 노출 정도에 따라 시술 적합성도 달라지므로, 정확한 견적과 방법은 대면 전문의 상담에서 안내받으시면 됩니다."
  );
}

function sanitizeConsultReply(reply: string, userText: string): string {
  if (!replyContainsForbiddenMeta(reply)) return reply;

  const text = userText.toLowerCase();
  if (/앞트임|뒤트임|밑트임|트임/.test(text) && /비용|가격|얼마|견적/.test(text)) {
    return buildEpicanthoplastyPriceFallback();
  }
  if (/비용|가격|얼마|견적/.test(text)) {
    return (
      "비용 문의 주셔서 감사합니다. 같은 시술이라도 마취 방식, 부가세·재료대 포함 여부, 단독/복합 시술, 난이도에 따라 체감 금액이 달라집니다. " +
      "상담 시 견적 항목을 하나씩 확인하시면 불필요한 오해를 줄일 수 있습니다. 개인별 정확한 금액은 대면 전문의 상담에서 안내해 드리는 것이 가장 정확합니다."
    );
  }
  if (/앞트임|뒤트임|밑트임|트임/.test(text)) {
    return (
      "트임 수술 문의 주셔서 감사합니다. 앞트임은 눈 사이 간격·앞쪽 노출·쌍꺼풀 라인과의 조화를 위해 검토하는 경우가 많고, 뒤트임은 눈꼬리 각도와 길이감에 영향을 줍니다. " +
      "과도한 트임은 비율이 어색해질 수 있어, 필요한 범위만 설계하는 것이 중요합니다. 본인에게 맞는 방법과 범위는 대면 상담 시 눈 구조를 확인한 뒤 결정하시면 됩니다."
    );
  }
  return reply.replace(
    /[^.!?]*(?:유튜브|대본|데이터에|영상에|설명되어)[^.!?]*[.!?]?/gi,
    "",
  ).trim() || "질문 주셔서 감사합니다. 시술 종류, 회복, 비용 구성, 부작용 중 궁금하신 부분을 조금 더 알려주시면, 그에 맞춰 차근차근 설명드리겠습니다.";
}

function buildPriceContextBlock(ctx: ConsultPriceContext): string {
  const lines = [
    `매칭 ${ctx.count}건, 시세 범위 ${formatPrice(ctx.min_price)}원 ~ ${formatPrice(ctx.max_price)}원`,
  ];
  for (const item of ctx.items.slice(0, 5)) {
    const range =
      item.price_min === item.price_max
        ? `${formatPrice(item.price_min)}원`
        : `${formatPrice(item.price_min)}원 ~ ${formatPrice(item.price_max)}원`;
    const tags = item.badges?.map((b) => b.label).join(", ");
    lines.push(
      `- ${item.hospital_name} / ${item.procedure_name}: ${range}${tags ? ` (${tags})` : ""}${item.remarks ? ` · ${item.remarks}` : ""}`
    );
  }
  return lines.join("\n");
}

function buildHistoryBlock(history?: ConsultChatMessage[]): string {
  if (!history?.length) return "";
  return history
    .map((m) => `${m.role === "user" ? "환자" : "실장"}: ${m.content}`)
    .join("\n");
}

function toRagMeta(rag: RagRetrievalResult): ConsultRagMeta {
  return {
    chunkCount: rag.meta.chunkCount,
    chunkIds: rag.meta.chunkIds,
    dataSource: rag.meta.dataSource,
    searchMethods: rag.meta.searchMethods,
  };
}

function parseConsultJson(text: string): Omit<ConsultChatResult, "source" | "ragMeta"> | null {
  const trimmed = text.trim();
  const defaultActions = ["질문 계속하기", "💰 가격 문의"];

  const normalize = (parsed: ConsultChatResult) => {
    if (!parsed?.reply || typeof parsed.reply !== "string") return null;
    return {
      reply: parsed.reply.trim(),
      intent: VALID_INTENTS.includes(parsed.intent) ? parsed.intent : "qa",
      category: parsed.category,
      procedureName: parsed.procedureName,
      nextActions: Array.isArray(parsed.nextActions)
        ? parsed.nextActions.filter((a) => typeof a === "string").slice(0, 4)
        : defaultActions,
    };
  };

  try {
    return normalize(JSON.parse(trimmed) as ConsultChatResult);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return normalize(JSON.parse(match[0]) as ConsultChatResult);
      } catch {
        /* fall through to partial recovery */
      }
    }

    // MAX_TOKENS 등으로 JSON이 잘린 경우 reply 필드만 복구
    const replyMatch = trimmed.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)/);
    if (replyMatch?.[1]) {
      const reply = replyMatch[1]
        .replace(/\\n/g, "\n")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\")
        .trim();
      if (reply.length >= 20) {
        return { reply, intent: "qa", nextActions: defaultActions };
      }
    }
    return null;
  }
}

function buildFallbackReply(
  userText: string,
  priceContext?: ConsultPriceContext,
  videoRefs?: YoutubeVideoRef[],
  ragMeta?: ConsultRagMeta
): ConsultChatResult {
  const text = userText.toLowerCase();
  if (priceContext && priceContext.count > 0) {
    return {
      reply: `${priceContext.matched_label ?? "문의하신 시술"} 기준으로 ${priceContext.count}곳 데이터를 확인했습니다. 대략 ${formatPrice(priceContext.min_price)}원~${formatPrice(priceContext.max_price)}원 범위입니다. 같은 시술도 마취비·부가세·재료대 포함 여부에 따라 체감 금액이 달라지니, 대면 상담 때 항목별로 꼭 확인해보세요.`,
      intent: "price",
      nextActions: ["질문 계속하기", "💰 가격 문의"],
      videoRefs,
      ragUsed: Boolean(videoRefs?.length),
      ragMeta,
      source: "fallback",
    };
  }
  if (/앞트임|뒤트임|밑트임|트임/.test(text) && /비용|가격|얼마|견적/.test(text)) {
    return {
      reply: buildEpicanthoplastyPriceFallback(),
      intent: "price",
      nextActions: ["질문 계속하기", "💰 가격 문의"],
      videoRefs,
      ragUsed: Boolean(videoRefs?.length),
      ragMeta,
      source: "fallback",
    };
  }
  if (/앞트임|뒤트임|밑트임|트임/.test(text)) {
    return {
      reply:
        "트임 수술 문의 주셔서 감사합니다. 앞트임은 눈 사이 간격·앞쪽 노출·쌍꺼풀 라인과의 조화를 위해 검토하는 경우가 많고, 뒤트임은 눈꼬리 각도와 길이감에 영향을 줍니다. 과도한 트임은 비율이 어색해질 수 있어, 필요한 범위만 설계하는 것이 중요합니다. 본인에게 맞는 방법과 범위는 대면 상담 시 눈 구조를 확인한 뒤 결정하시면 됩니다.",
      intent: "qa",
      nextActions: ["질문 계속하기", "바로 분석 시작"],
      videoRefs,
      ragUsed: Boolean(videoRefs?.length),
      ragMeta,
      source: "fallback",
    };
  }
  if (/쌍꺼풀|눈매|인아웃|세미아웃|아웃라인/.test(text)) {
    return {
      reply:
        "걱정되시는 마음 충분히 이해됩니다. 쌍꺼풀은 매몰·절개·부분절개로 나뉘며, 라인은 인아웃·세미아웃·아웃 중 얼굴 비율과 눈꼬리 각도에 맞춰 선택합니다. 인아웃은 자연스러운 인상, 세미아웃은 또렷함과 자연스러움의 균형, 아웃은 시원한 인상에 가깝습니다. 눈뜨는 힘이 약하면 눈매교정을 함께 검토하는 경우도 많으니, 정확한 판단은 대면 진료 시 확인해보세요.",
      intent: "qa",
      nextActions: ["질문 계속하기", "바로 분석 시작"],
      videoRefs,
      ragUsed: Boolean(videoRefs?.length),
      ragMeta,
      source: "fallback",
    };
  }
  return {
    reply:
      "질문 주셔서 감사합니다. 시술 종류, 회복 기간, 비용 포함 항목, 부작용 중 어떤 부분이 가장 궁금하신지 알려주시면, 그 부분부터 차근차근 설명드리겠습니다.",
    intent: "qa",
    nextActions: ["질문 계속하기", "💰 가격 문의"],
    videoRefs,
    ragUsed: Boolean(videoRefs?.length),
    ragMeta,
    source: "fallback",
  };
}

function finalizeConsultResult(
  result: ConsultChatResult,
  userText: string,
): ConsultChatResult {
  return {
    ...result,
    reply: sanitizeConsultReply(result.reply, userText),
  };
}

export async function generateConsultReply(input: ConsultChatInput): Promise<ConsultChatResult> {
  // 파이프라인: 질문 → DB 검색 → RAG 슬롯 포맷 → 프롬프트 조립
  const rag = await retrieveRagContext(input.userText, 4, input.hospitalId);
  const ragMeta = toRagMeta(rag);

  if (!process.env.GEMINI_API_KEY) {
    return finalizeConsultResult(
      buildFallbackReply(input.userText, input.priceContext, rag.videoRefs, ragMeta),
      input.userText,
    );
  }

  const userPrompt = assembleConsultPrompt(CONSULT_PERSONA, {
    sessionContext: buildSessionContextBlock({
      category: input.category,
      procedureName: input.procedureName,
      concernTags: input.concernTags,
      hasAnalysis: input.hasAnalysis,
    }),
    ragTranscriptContext: rag.contextBlock,
    priceContext: input.priceContext ? buildPriceContextBlock(input.priceContext) : "",
    history: buildHistoryBlock(input.history),
    userQuestion: input.userText,
  });

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      config: {
        temperature: CONSULT_TEMPERATURE,
        topP: CONSULT_TOP_P,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            reply: {
              type: "string",
              description:
                "한국어 상담 답변 3~6문장. PreFit AI 실장 1인칭. 영상·대본·데이터 부재 언급 금지. 가격·시술은 일반 상담 정보로 설명하고 확정 수치는 대면 상담으로 연결.",
            },
            intent: {
              type: "string",
              enum: ["qa", "analysis", "booking", "price", "select_procedure"],
            },
            category: { type: "string" },
            procedureName: { type: "string" },
            nextActions: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["reply", "intent", "nextActions"],
        },
        safetySettings: CONSULT_SAFETY_SETTINGS,
      },
    });

    const finish = response.candidates?.[0]?.finishReason;
    if (finish === "SAFETY" || finish === "RECITATION" || !response.text?.trim()) {
      console.warn("[consult-gemini] blocked or empty:", finish);
      return finalizeConsultResult(
        buildFallbackReply(input.userText, input.priceContext, rag.videoRefs, ragMeta),
        input.userText,
      );
    }

    const parsed = parseConsultJson(response.text);
    if (!parsed) {
      console.warn("[consult-gemini] JSON parse failed, finish:", finish);
      return finalizeConsultResult(
        buildFallbackReply(input.userText, input.priceContext, rag.videoRefs, ragMeta),
        input.userText,
      );
    }

    return finalizeConsultResult(
      {
        ...parsed,
        videoRefs: rag.videoRefs.length ? rag.videoRefs : undefined,
        ragUsed: rag.chunks.length > 0,
        ragMeta,
        source: "gemini",
      },
      input.userText,
    );
  } catch (error) {
    console.error("[consult-gemini] error:", error);
    return finalizeConsultResult(
      buildFallbackReply(input.userText, input.priceContext, rag.videoRefs, ragMeta),
      input.userText,
    );
  }
}
