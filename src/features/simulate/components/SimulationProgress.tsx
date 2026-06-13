"use client";

import { AnimatePresence, motion } from "framer-motion";

const LOADING_MESSAGES = [
  "AI가 환자분의 골격을 분석하여 최적의 비율을 계산 중입니다...",
  "전문의 데이터 기반 라인을 적용하고 있습니다...",
  "Stable Diffusion으로 자연스러운 결과를 합성 중입니다...",
  "피부 텍스처와 조명을 맞추는 중입니다...",
] as const;

interface SimulationProgressProps {
  messageIndex: number;
}

export function SimulationProgress({ messageIndex }: SimulationProgressProps) {
  const message = LOADING_MESSAGES[messageIndex % LOADING_MESSAGES.length];

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative h-24 w-24">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-mint/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.div
          className="absolute inset-2 rounded-full border-2 border-mint/40"
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          style={{ borderTopColor: "transparent" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl">✨</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={message}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35 }}
          className="max-w-xs text-center text-sm leading-relaxed text-muted"
        >
          {message}
        </motion.p>
      </AnimatePresence>

      <div className="flex w-full max-w-xs flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 overflow-hidden rounded-full bg-border"
          >
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-mint to-lavender"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export { LOADING_MESSAGES };
