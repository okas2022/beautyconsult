import { GoogleGenAI } from "@google/genai";
import { loadKnowledgeContext } from "@/lib/knowledge/load-videos-knowledge";

const SYSTEM_INSTRUCTION = `당신은 성형외과/피부과의 신뢰감 있는 AI 전문 상담 실장입니다.
제공되는 [유튜브 대본 데이터]만을 완벽히 숙지하고 이를 기반으로 환자에게 설명하세요.
데이터에 없는 의학적 수술법이나 수치는 절대 허구로 지어내지 마십시오(환각 제한).
말투는 환자의 고민에 깊이 공감하되 지식을 전달할 때는 명확하게 어미를 '~해보세요', '~랍니다'로 부드럽게 맺으십시오.
답변을 작성할 때 참고한 데이터 구간이 있다면 문장 끝이나 하단에 반드시 https://youtu.be/{video_id}?t={seconds} 형식의 유튜브 타임라인 하이퍼링크를 포함해야 합니다.`;

const MODEL_CANDIDATES = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"] as const;
const TEMPERATURE = 0.25;

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateChatReplyInput {
  message: string;
  history?: ChatHistoryItem[];
  tenantId?: string;
}

export interface GenerateChatReplyResult {
  reply: string;
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

위 [유튜브 대본 데이터]만 근거로 3~6문장 한국어로 답변하세요.
참고한 구간이 있으면 https://youtu.be/{video_id}?t={seconds} 링크를 포함하세요.`;
}

function buildFallbackReply(message: string): string {
  const lower = message.toLowerCase();
  if (/부종|붓/.test(lower)) {
    return (
      "걱정되시는 마음 충분히 이해합니다. 쌍꺼풀 수술 후 2~4주간 부종은 흔한 경과랍니다. " +
      "다만 한쪽만 심하거나 통증·발열이 동반되면 꼭 내원해 확인해보세요. " +
      "관련 설명: https://youtu.be/eh5R8K4fOxs?t=120"
    );
  }
  if (/모티바|가슴|보형물/.test(lower)) {
    return (
      "모티바 비용은 cc 용량과 마취 방식, 부가 항목 포함 여부에 따라 달라집니다. " +
      "상담 시 마취비·재료대·부가세 포함 여부를 꼭 확인해보세요. " +
      "관련 설명: https://youtu.be/AQODTXc5-H0?t=155"
    );
  }
  return (
    "질문 주셔서 감사합니다. 눈·코·가슴·회복·비용 중 어떤 부분이 가장 궁금하신지 알려주시면, " +
    "원장님 대본 자료를 바탕으로 차근차근 설명드리겠습니다."
  );
}

async function generateWithModel(
  client: GoogleGenAI,
  model: string,
  userPrompt: string,
): Promise<string> {
  const response = await client.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    config: {
      temperature: TEMPERATURE,
      topP: 0.85,
      maxOutputTokens: 1024,
      systemInstruction: SYSTEM_INSTRUCTION,
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

export async function generateChatReply(
  input: GenerateChatReplyInput,
): Promise<GenerateChatReplyResult> {
  const knowledgeContext = await loadKnowledgeContext(input.tenantId);
  const userPrompt = buildUserPrompt(knowledgeContext, input.message, input.history);

  const client = getClient();
  if (!client) {
    return {
      reply: buildFallbackReply(input.message),
      model: "fallback",
      source: "fallback",
    };
  }

  for (const model of MODEL_CANDIDATES) {
    try {
      const reply = await generateWithModel(client, model, userPrompt);
      return { reply, model, source: "gemini" };
    } catch (error) {
      console.warn(`[chat-service] model ${model} failed:`, error);
    }
  }

  return {
    reply: buildFallbackReply(input.message),
    model: "fallback",
    source: "fallback",
  };
}
