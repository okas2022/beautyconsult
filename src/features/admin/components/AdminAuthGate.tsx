"use client";

import { useState } from "react";
import { Building2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface AdminAuthGateProps {
  title: string;
  description: string;
  children: (adminKey: string) => React.ReactNode;
}

export function AdminAuthGate({
  title,
  description,
  children,
}: AdminAuthGateProps) {
  const [adminKey, setAdminKey] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputKey, setInputKey] = useState("");

  const handleLogin = () => {
    if (!inputKey.trim()) return;
    setAdminKey(inputKey.trim());
    setIsAuthenticated(true);
  };

  if (!isAuthenticated) {
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
        </div>
      </div>
    );
  }

  return <>{children(adminKey)}</>;
}
