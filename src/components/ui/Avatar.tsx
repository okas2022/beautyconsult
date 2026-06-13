import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";

interface AvatarProps {
  role: "user" | "assistant";
  className?: string;
}

export function Avatar({ role, className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        role === "assistant"
          ? "bg-gradient-to-br from-mint/20 to-lavender/20 text-mint-dark"
          : "bg-muted/10 text-muted",
        className,
      )}
    >
      {role === "assistant" ? (
        <Sparkles className="h-4 w-4" strokeWidth={1.75} />
      ) : (
        <User className="h-4 w-4" strokeWidth={1.75} />
      )}
    </div>
  );
}
