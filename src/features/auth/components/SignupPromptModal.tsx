"use client";

import Link from "next/link";
import { X } from "lucide-react";

interface SignupPromptModalProps {
  open: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
}

export function SignupPromptModal({
  open,
  title = "회원가입 후 이용 가능합니다",
  description = "AI 상담·가상 성형·프리미엄 등 전체 기능은 회원가입 후 이용하실 수 있습니다.",
  onClose,
}: SignupPromptModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-surface p-5 shadow-xl">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-muted hover:bg-foreground/[0.05]"
            aria-label="닫기"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/signup"
            className="flex h-11 items-center justify-center rounded-xl bg-foreground text-sm font-semibold text-white"
          >
            회원가입
          </Link>
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-xl border border-border text-sm font-medium text-foreground"
          >
            로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
