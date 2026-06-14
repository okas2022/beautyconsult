"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flame, MessageCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/chat", label: "상담하기", icon: MessageCircle },
  { href: "/trend", label: "트렌드", icon: Flame },
  { href: "/mypage", label: "마이페이지", icon: User },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 h-[calc(3.5rem+env(safe-area-inset-bottom))] border-t border-border/60 bg-surface/90 backdrop-blur-xl md:hidden"
    >
      <div className="mx-auto flex h-[3.5rem] max-w-lg items-stretch">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-0.5 py-2.5 transition-colors",
                isActive ? "text-foreground" : "text-muted hover:text-foreground/80",
              )}
            >
              <Icon
                className={cn("h-5 w-5", isActive && "text-mint-dark")}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span
                className={cn(
                  "text-[10px] font-medium",
                  isActive && "font-semibold text-foreground",
                )}
              >
                {label}
              </span>
              {isActive && (
                <span className="absolute bottom-[calc(env(safe-area-inset-bottom)+4px)] h-0.5 w-8 rounded-full bg-foreground/80" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
