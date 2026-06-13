"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { MobileNav } from "@/components/layout/MobileNav";
import { TenantBootstrapGate } from "@/features/hospitals/components/TenantBootstrapGate";
import { PremiumBootstrap } from "@/features/premium/components/PremiumBootstrap";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isFullHeight = pathname.startsWith("/chat") || pathname.startsWith("/simulate");
  const hideFooter =
    isFullHeight ||
    pathname.startsWith("/trend") ||
    pathname.startsWith("/mypage");

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <TenantBootstrapGate />
      <PremiumBootstrap />
      <Header />

      <main
        className={cn(
          "flex flex-1 flex-col",
          isFullHeight
            ? "overflow-hidden pb-0"
            : "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0",
        )}
      >
        {children}
      </main>

      {!hideFooter && <Footer />}
      <MobileNav />
    </div>
  );
}
