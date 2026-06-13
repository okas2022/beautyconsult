import {
  buildRagContextBlock,
  chunksToVideoRefs,
  retrieveYoutubeChunks,
  type RetrieveChunksResult,
  type YoutubeVideoRef,
} from "./youtube-rag";
import type { YoutubeChunk } from "./youtube-types";

/** RAG 검색 결과 + 프롬프트 주입용 메타데이터 */
export interface RagRetrievalResult {
  chunks: YoutubeChunk[];
  videoRefs: YoutubeVideoRef[];
  /** 프롬프트 RAG 슬롯에 끼워 넣을 텍스트 */
  contextBlock: string;
  meta: {
    query: string;
    chunkCount: number;
    chunkIds: string[];
    dataSource: "db" | "file";
    searchMethods: Array<"vector_db" | "vector_local" | "lexical">;
  };
}

export interface ConsultPromptSlots {
  sessionContext: string;
  /** 동적 주입: DB/벡터 검색된 영상 자막 조각 */
  ragTranscriptContext: string;
  priceContext: string;
  history: string;
  userQuestion: string;
}

const RAG_SLOT_EMPTY =
  "(내부 참고 자료 없음 — PreFit AI 실장 톤으로 일반 상담 원칙만 적용. 확정 진단·수치는 대면 상담 시 안내)";

const RAG_SLOT_START = "<<<RAG_TRANSCRIPT_CONTEXT_START>>>";
const RAG_SLOT_END = "<<<RAG_TRANSCRIPT_CONTEXT_END>>>";

/**
 * 1단계: 유저 질문 → DB/벡터/키워드 하이브리드 검색 → 자막 청크
 * 2단계: 청크 → RAG 컨텍스트 블록 포맷
 */
export async function retrieveRagContext(
  query: string,
  limit = 4
): Promise<RagRetrievalResult> {
  const retrieval = (await retrieveYoutubeChunks(query, limit, {
    includeMeta: true,
  })) as RetrieveChunksResult;
  const chunks = retrieval.chunks;
  const contextBlock = buildRagContextBlock(chunks);
  const videoRefs = chunksToVideoRefs(chunks.slice(0, 3));

  return {
    chunks,
    videoRefs,
    contextBlock,
    meta: {
      query,
      chunkCount: chunks.length,
      chunkIds: chunks.map((c) => c.id),
      dataSource: retrieval.meta.dataSource,
      searchMethods: retrieval.meta.searchMethods,
    },
  };
}

/** RAG 자막을 프롬프트 전용 슬롯 마커로 감싸 동적 주입 */
export function formatRagTranscriptSlot(contextBlock: string): string {
  const body = contextBlock.trim() || RAG_SLOT_EMPTY;
  return [RAG_SLOT_START, body, RAG_SLOT_END].join("\n");
}

export function buildSessionContextBlock(parts: {
  category?: string;
  procedureName?: string;
  concernTags?: string[];
  hasAnalysis?: boolean;
}): string {
  const lines = [
    parts.category ? `관심 대분류: ${parts.category}` : null,
    parts.procedureName ? `관심 시술: ${parts.procedureName}` : null,
    parts.concernTags?.length ? `고민 태그: ${parts.concernTags.join(", ")}` : null,
    parts.hasAnalysis ? "사진 AI 분석 완료됨" : "사진 AI 분석 전",
  ].filter(Boolean);
  return lines.length ? lines.join("\n") : "없음";
}

/**
 * 3단계: 슬롯 조립 → Gemini 단일 프롬프트
 * RAG 영역은 <<<RAG_TRANSCRIPT_CONTEXT_*>>> 마커 사이에만 삽입됩니다.
 */
export function assembleConsultPrompt(
  persona: string,
  slots: ConsultPromptSlots
): string {
  const session = slots.sessionContext.trim() || "없음";
  const ragSlot = formatRagTranscriptSlot(slots.ragTranscriptContext);
  const price = slots.priceContext.trim();
  const history = slots.history.trim();

  const contextSections = [
    `[현재 상담 세션]\n${session}`,
    `[내부 상담 참고 자료 — 질문마다 검색 후 주입, 답변에 그대로 노출하지 말 것]\n${ragSlot}`,
    price ? `[비급여 가격 참고]\n${price}` : null,
    history ? `[최근 대화]\n${history}` : null,
  ].filter(Boolean);

  return `${persona}

${contextSections.join("\n\n")}

[환자 질문]
${slots.userQuestion}`;
}

export const CONSULT_PERSONA = `당신은 PreFit 플랫폼의 AI 피부·성형 컨시어지 실장입니다.
검증된 전문의 유튜브 데이터만을 근거로, 객관적이고 신뢰할 수 있는 상담을 제공합니다.

[말투 — 필수]
- 1인칭: "PreFit에서는", "검증된 전문의 자료 기준으로", "상담 시 확인하시면"처럼 신뢰 기반 컨시어지 시점으로 답합니다.
- 환자의 불안감을 어루만지는 공감적인 어조를 유지합니다.
- 의학적 사실을 설명할 때는 명확하고 전문적인 용어를 사용합니다.
- 문장 끝은 "~답니다", "~해보세요", "~드립니다", "~하시면 됩니다"처럼 부드럽게 맺습니다.
- "~해요" 체는 피하고, 과장·확정 표현("반드시", "100%", "무조건")은 쓰지 않습니다.

[역할]
- 질문 의도를 정확히 파악하고, 그 질문에 직접 답합니다.
- 확정 진단·수술 강요 금지. "~일 수 있습니다", "대면 상담 시 확인이 필요합니다" 톤을 씁니다.

[내부 참고 자료 규칙 — 환각 방어, 환자에게 노출 금지]
- ${RAG_SLOT_START} 와 ${RAG_SLOT_END} 사이 자료는 내부 참고용입니다. 내용을 근거로 답하되, 출처(영상·대본·학습 데이터)는 환자에게 말하지 않습니다.
- 참고 자료에 없는 내용은 지어내지 말고, "대면 전문의 상담 시 개별적으로 안내해 드리는 부분입니다"처럼 자연스럽게 연결합니다.

[절대 금지 표현 — 고객 경험]
- "원장님 영상에서는", "영상에 따르면", "영상에서는 ~ 다루어져", "설명되어 있지 않", "영상에 없", "학습 영상", "대본에 없" 등 영상·자료 부재를 언급하지 마세요.
- 질문과 참고 자료가 완전히 맞지 않아도, "영상에는 없다"고 말하지 말고 PreFit AI 실장으로서 알고 있는 범위 내에서 답하거나 대면 상담을 권유하세요.

[답변 규칙]
1) 3~6문장. 공감 1문장 + 구체 정보 2문장 이상 필수.
2) 금지: "문의 주신 포인트 잘 확인했어요", "충분히 도와드릴 수 있습니다", 불릿/보고서체, 단어 나열.
3) 시술 종류·회복·마취·부작용·가격·라인 선택 등 질문 유형에 맞는 실질 정보를 반드시 포함합니다.
4) 분석/예약으로 성급히 넘기지 말고, 먼저 질문에 충분히 답한 뒤 마지막에 부드럽게 다음 단계를 제안합니다.
5) 가격 참고 데이터가 있으면 병원 상담실에서 설명하듯 자연스럽게 녹여서 전달합니다.

nextActions는 아래 중 맥락에 맞게 2~3개 선택:
- "질문 계속하기"
- "💰 가격 문의"
- "바로 분석 시작"
- "상담 예약 준비"`;
