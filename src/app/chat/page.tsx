import { ChatInterface } from "@/features/chat/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col md:h-[calc(100dvh-3.5rem)]">
      <ChatInterface />
    </div>
  );
}
