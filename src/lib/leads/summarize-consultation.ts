import { GoogleGenAI } from "@google/genai";

export async function summarizeConsultation(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  videoTitle?: string,
): Promise<string> {
  const transcript = messages
    .slice(-12)
    .map((m) => `${m.role === "user" ? "환자" : "AI실장"}: ${m.content}`)
    .join("\n");

  const videoContext = videoTitle
    ? `\n관심 영상: ${videoTitle}`
    : "";

  const fallback = buildFallbackSummary(messages, videoTitle);

  if (!process.env.GEMINI_API_KEY) {
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `다음 AI 상담 대화를 병원 실장이 읽을 수 있는 3~5문장 한국어 요약으로 작성하세요.
포함: 환자 주요 고민, 관심 시술/부위, AI가 안내한 핵심 내용, 예약 동기.
${videoContext}

[상담 대화]
${transcript}`,
            },
          ],
        },
      ],
      config: {
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    });

    const text = response.text?.trim();
    return text && text.length >= 20 ? text : fallback;
  } catch (error) {
    console.error("[summarizeConsultation] error:", error);
    return fallback;
  }
}

function buildFallbackSummary(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  videoTitle?: string,
): string {
  const userMessages = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .slice(-3);

  const concerns = userMessages.join(" / ") || "상담 내용 미확인";
  const video = videoTitle ? ` 관심 영상: ${videoTitle}.` : "";
  return `환자 문의: ${concerns.slice(0, 200)}.${video} AI 상담 후 원장님 예약/상담을 희망합니다.`;
}
