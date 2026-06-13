import { create } from "zustand";

interface TrendHandoffState {
  pendingPrompt: string | null;
  setPendingPrompt: (prompt: string | null) => void;
  consumePendingPrompt: () => string | null;
}

export const useTrendHandoffStore = create<TrendHandoffState>((set, get) => ({
  pendingPrompt: null,
  setPendingPrompt: (prompt) => set({ pendingPrompt: prompt }),
  consumePendingPrompt: () => {
    const prompt = get().pendingPrompt;
    set({ pendingPrompt: null });
    return prompt;
  },
}));
