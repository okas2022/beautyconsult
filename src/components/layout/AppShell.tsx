"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isChat = pathname.startsWith("/chat");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Header />

      <main
        className={cn(
          "flex flex-1 flex-col",
          isChat
            ? "overflow-hidden pb-0"
            : "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0",
        )}
      >
        {children}
      </main>

      {!isChat && <Footer />}
      <MobileNav />
    </div>
  );
}
