import type { ChatMessage } from "@/features/chat/types/chat.types";

export type ChatSendBlockReason = "auth_required" | "guest_limit";

export type ChatSendResult =
  | { ok: true }
  | { ok: false; reason: ChatSendBlockReason };

export type ChatApiHistoryItem = Pick<ChatMessage, "role" | "content">;
