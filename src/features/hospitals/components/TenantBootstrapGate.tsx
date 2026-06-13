"use client";

import { Suspense } from "react";
import { TenantBootstrap } from "@/features/hospitals/components/TenantBootstrap";

export function TenantBootstrapGate() {
  return (
    <Suspense fallback={null}>
      <TenantBootstrap />
    </Suspense>
  );
}
