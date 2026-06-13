import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-surface">
      <div className="mx-auto max-w-lg px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-col gap-3 text-center">
          <p className="text-xs text-muted">
            PreFit은 검증된 전문의 콘텐츠 기반 AI 상담 플랫폼입니다.
          </p>
          <div className="flex items-center justify-center gap-4 text-[11px] text-muted/70">
            <Link href="#" className="hover:text-foreground transition-colors">
              이용약관
            </Link>
            <span aria-hidden>·</span>
            <Link href="#" className="hover:text-foreground transition-colors">
              개인정보처리방침
            </Link>
            <span aria-hidden>·</span>
            <Link href="#" className="hover:text-foreground transition-colors">
              문의
            </Link>
          </div>
          <p className="text-[10px] text-muted/50">
            © 2026 PreFit. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
