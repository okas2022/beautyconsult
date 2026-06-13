"use client";

import { useEffect, useState } from "react";
import { Building2, KeyRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAdminAuthStore } from "@/features/admin/store/adminAuthStore";

interface AdminAuthGateProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
}

export function AdminAuthGate({
  title = "PreFit Admin",
  description = "병원 관계자 전용 대시보드 — Admin Key로 로그인하세요.",
  children,
}: AdminAuthGateProps) {
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const adminKey = useAdminAuthStore((s) => s.adminKey);
  const login = useAdminAuthStore((s) => s.login);
  const logout = useAdminAuthStore((s) => s.logout);
  const [inputKey, setInputKey] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    finish();
    return useAdminAuthStore.persist.onFinishHydration(finish);
  }, []);

  const handleLogin = () => {
    if (!inputKey.trim()) return;
    login(inputKey);
  };

  if (!hydrated) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-mint border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated || !adminKey) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-sm flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-mint-dark" />
            <h1 className="text-lg font-semibold">{title}</h1>
          </div>
          <p className="mb-4 text-sm text-muted">{description}</p>
          <label className="mb-4 block">
            <span className="mb-2 flex items-center gap-1.5 text-xs font-medium">
              <KeyRound className="h-3.5 w-3.5" />
              Admin Key
            </span>
            <input
              type="password"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="ADMIN_SECRET_KEY"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:border-mint/50 focus:outline-none focus:ring-2 focus:ring-mint/20"
            />
          </label>
          <Button variant="primary" size="md" className="w-full" onClick={handleLogin}>
            접속
          </Button>
          <p className="mt-3 text-center text-[10px] text-muted">
            브라우저 탭을 닫으면 자동 로그아웃됩니다 (sessionStorage)
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-10 flex items-center justify-end border-b border-border/60 bg-background/95 px-4 py-2 backdrop-blur-sm">
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] text-muted transition hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-3.5 w-3.5" />
          Admin 로그아웃
        </button>
      </div>
      {children}
    </>
  );
}
