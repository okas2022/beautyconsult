"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const isChat = pathname.startsWith("/chat");

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-mint to-lavender">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <span className="text-base font-semibold tracking-tight text-foreground">
              PreFit
            </span>
            {isChat && (
              <p className="text-[10px] leading-none text-muted">AI 상담</p>
            )}
          </div>
        </Link>

        {!isChat && (
          <Link
            href="/chat"
            className={cn(
              "flex items-center gap-1.5 rounded-full bg-mint px-4 py-2",
              "text-xs font-semibold text-white shadow-sm",
              "transition-all hover:bg-mint-dark active:scale-[0.97]",
            )}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            상담 시작
          </Link>
        )}
      </div>
    </header>
  );
}
