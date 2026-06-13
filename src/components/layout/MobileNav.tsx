"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: Home },
  { href: "/chat", label: "상담", icon: MessageCircle },
  { href: "/simulate", label: "시뮬", icon: Sparkles },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/60 bg-surface/90 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex max-w-lg items-stretch pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={label}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors",
                isActive ? "text-mint-dark" : "text-muted hover:text-foreground",
              )}
            >
              <Icon
                className="h-5 w-5"
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span className="text-[10px] font-medium">{label}</span>
              {isActive && (
                <span className="absolute bottom-[calc(env(safe-area-inset-bottom)+4px)] h-0.5 w-8 rounded-full bg-mint" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
