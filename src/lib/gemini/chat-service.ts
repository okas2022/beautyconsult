import { GoogleGenAI } from "@google/genai";
import { loadHospitalRagContext } from "@/lib/knowledge/hospital-rag";
import { detectSymptomsFromText } from "@/lib/commerce/product-catalog";
import { DEFAULT_HOSPITAL_ID } from "@/features/leads/types/lead.types";

const COMMERCE_SYMPTOMS = ["건조", "홍조", "여드름", "흉터"] as const;

const SYSTEM_INSTRUCTION = `당신은 성형외과/피부과의 신뢰감 있는 AI 전문 상담 실장입니다.
제공되는 [유튜브 대본 데이터]만을 완벽히 숙지하고 이를 기반으로 환자에게 설명하세요.
데이터에 없는 의학적 수술법이나 수치는 절대 허구로 지어내지 마십시오(환각 제한).
말투는 환자의 고민에 깊이 공감하되 지식을 전달할 때는 명확하게 어미를 '~해보세요', '~랍니다'로 부드럽게 맺으십시오.
답변을 작성할 때 참고한 데이터 구간이 있다면 문장 끝이나 하단에 반드시 https://youtu.be/{video_id}?t={seconds} 형식의 유튜브 타임라인 하이퍼링크를 포함해야 합니다.

[커머스 타겟팅 규칙]
환자의 증상이 ${COMMERCE_SYMPTOMS.join(", ")} 중 하나와 강하게 일치하면:
1) reply 마지막에 "해당 증상 완화에 도움을 주는 제품을 확인해보세요." 문구를 자연스럽게 포함하세요.
2) symptom_keywords 배열에 일치하는 증상 키워드만 넣으세요 (최대 2개).
증상이 불분명하면 symptom_keywords는 빈 배열 []로 반환하세요.`;

const MODEL_CANDIDATES = [
  "gemini-2.5-flash",
  "gemini-flash-latest",
  "gemini-2.5-pro",
] as const;
const TEMPERATURE = 0.25;

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateChatReplyInput {
  message: string;
  history?: ChatHistoryItem[];
  tenantId?: string;
  hospitalId?: string;
}

export interface GenerateChatReplyResult {
  reply: string;
  symptomKeywords: string[];
  model: string;
  source: "gemini" | "fallback";
}

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function buildHistoryBlock(history?: ChatHistoryItem[]): string {
  if (!history?.length) return "";
  return history
    .slice(-6)
    .map((m) => `${m.role === "user" ? "환자" : "실장"}: ${m.content}`)
    .join("\n");
}

function buildUserPrompt(
  knowledgeContext: string,
  message: string,
  history?: ChatHistoryItem[],
): string {
  const historyBlock = buildHistoryBlock(history);

  return `[유튜브 대본 데이터]
${knowledgeContext}

${historyBlock ? `[최근 대화]\n${historyBlock}\n\n` : ""}[환자 질문]
${message}

위 [유튜브 대본 데이터]만 근거로 JSON 형식으로 답변하세요.
- reply: 3~6문장 한국어 (참고 구간 있으면 youtu.be 링크 포함)
- symptom_keywords: ${COMMERCE_SYMPTOMS.join("|")} 중 강하게 일치하는 키워드 배열, 없으면 []`;
}

interface ParsedChatJson {
  reply: string;
  symptom_keywords: string[];
}

function parseChatJson(text: string): ParsedChatJson | null {
  try {
    const parsed = JSON.parse(text.trim()) as ParsedChatJson;
    if (typeof parsed.reply === "string") {
      return {
        reply: parsed.reply.trim(),
        symptom_keywords: Array.isArray(parsed.symptom_keywords)
          ? parsed.symptom_keywords.filter((k) => typeof k === "string")
          : [],
      };
    }
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return parseChatJson(match[0]);
      } catch {
        return null;
      }
    }
  }
  return null;
}

function buildFallbackReply(message: string): GenerateChatReplyResult {
  const symptoms = detectSymptomsFromText(message);
  const lower = message.toLowerCase();

  let reply: string;
  if (/부종|붓/.test(lower)) {
    reply =
      "걱정되시는 마음 충분히 이해합니다. 쌍꺼풀 수술 후 2~4주간 부종은 흔한 경과랍니다. " +
      "다만 한쪽만 심하거나 통증·발열이 동반되면 꼭 내원해 확인해보세요. " +
      "관련 설명: https://youtu.be/eh5R8K4fOxs?t=120";
  } else if (/모티바|가슴|보형물/.test(lower)) {
    reply =
      "모티바 비용은 cc 용량과 마취 방식, 부가 항목 포함 여부에 따라 달라집니다. " +
      "상담 시 마취비·재료대·부가세 포함 여부를 꼭 확인해보세요. " +
      "관련 설명: https://youtu.be/AQODTXc5-H0?t=155";
  } else if (symptoms.length) {
    reply =
      `말씀하신 ${symptoms.join(", ")} 고민 충분히 이해됩니다. ` +
      "생활 습관과 보습·자외선 차단을 함께 챙겨보시면 도움이 됩니다. " +
      "해당 증상 완화에 도움을 주는 제품을 확인해보세요.";
  } else {
    reply =
      "질문 주셔서 감사합니다. 눈·코·가슴·회복·비용 중 어떤 부분이 가장 궁금하신지 알려주시면, " +
      "원장님 대본 자료를 바탕으로 차근차근 설명드리겠습니다.";
  }

  return {
    reply,
    symptomKeywords: symptoms,
    model: "fallback",
    source: "fallback",
  };
}

async function generateWithModel(
  client: GoogleGenAI,
  model: string,
  userPrompt: string,
): Promise<GenerateChatReplyResult> {
  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      temperature: TEMPERATURE,
      topP: 0.85,
      maxOutputTokens: 1024,
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          reply: {
            type: "string",
            description: "한국어 상담 답변 3~6문장",
          },
          symptom_keywords: {
            type: "array",
            items: { type: "string", enum: [...COMMERCE_SYMPTOMS] },
            description: "일치하는 증상 키워드, 없으면 빈 배열",
          },
        },
        required: ["reply", "symptom_keywords"],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Empty Gemini response");

  const parsed = parseChatJson(text);
  if (!parsed) throw new Error("JSON parse failed");

  return {
    reply: parsed.reply,
    symptomKeywords: parsed.symptom_keywords,
    model,
    source: "gemini",
  };
}

export async function generateChatReply(
  input: GenerateChatReplyInput,
): Promise<GenerateChatReplyResult> {
  const hospitalId = input.hospitalId ?? DEFAULT_HOSPITAL_ID;
  const rag = await loadHospitalRagContext(input.message, hospitalId);
  const userPrompt = buildUserPrompt(rag.context, input.message, input.history);

  const client = getClient();
  if (!client) {
    return buildFallbackReply(input.message);
  }

  for (const model of MODEL_CANDIDATES) {
    try {
      return await generateWithModel(client, model, userPrompt);
    } catch (error) {
      console.warn(`[chat-service] model ${model} failed:`, error);
    }
  }

  return buildFallbackReply(input.message);
}
