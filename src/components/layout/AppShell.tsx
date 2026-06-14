"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import {
  isMobileTabPath,
} from "@/components/layout/constants";
import { MobileNav } from "@/components/layout/MobileNav";
import { AdBootstrap } from "@/features/ads/components/AdBootstrap";
import { TenantBootstrapGate } from "@/features/hospitals/components/TenantBootstrapGate";
import { PremiumBootstrap } from "@/features/premium/components/PremiumBootstrap";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isTabPage = isMobileTabPath(pathname);
  const isChat = pathname.startsWith("/chat");
  const isImmersive = pathname.startsWith("/simulate");
  const hideFooter = isTabPage || isImmersive;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <TenantBootstrapGate />
      <PremiumBootstrap />
      <AdBootstrap />
      <Header />

      <main
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          (isTabPage || isImmersive) &&
            "pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0",
          isChat || isImmersive
            ? "overflow-hidden"
            : isTabPage
              ? "overflow-y-auto overscroll-contain"
              : "overflow-y-auto",
        )}
      >
        {children}
      </main>

      {!hideFooter && <Footer />}
      <MobileNav />
    </div>
  );
}
