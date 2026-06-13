import Link from "next/link";
import { ArrowRight, Shield, Sparkles, Video } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "검증된 근거",
    description: "전문의 유튜브 영상만을 RAG 데이터로 활용",
  },
  {
    icon: Video,
    title: "영상 기반 답변",
    description: "답변마다 관련 영상 카드로 출처 확인",
  },
  {
    icon: Sparkles,
    title: "AI 실장 상담",
    description: "24시간 언제든 피부·성형 고민 상담",
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 pt-8 md:pt-16">
      {/* Hero */}
      <section className="mb-12 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-4 py-1.5">
          <Sparkles className="h-3.5 w-3.5 text-mint-dark" />
          <span className="text-xs font-medium text-mint-dark">
            차세대 신뢰 기반 AI 컨시어지
          </span>
        </div>

        <h1 className="mb-4 text-[2rem] font-semibold leading-tight tracking-tight text-foreground">
          가짜 후기 없이,
          <br />
          <span className="bg-gradient-to-r from-mint-dark to-lavender bg-clip-text text-transparent">
            전문의 근거
          </span>
          로 답합니다
        </h1>

        <p className="mx-auto mb-8 max-w-xs text-[15px] leading-relaxed text-muted">
          PreFit AI 실장이 검증된 전문의 유튜브 데이터만을 바탕으로
          객관적인 피부·성형 상담을 제공합니다.
        </p>

        <Link
          href="/chat"
          className="inline-flex h-12 items-center gap-2 rounded-full bg-foreground px-8 text-sm font-semibold text-white shadow-lg transition-all hover:bg-foreground/90 active:scale-[0.97]"
        >
          무료 AI 상담 시작
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Features */}
      <section className="mb-8 flex flex-col gap-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mint/10">
              <Icon className="h-5 w-5 text-mint-dark" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="mb-0.5 text-sm font-semibold text-foreground">
                {title}
              </h3>
              <p className="text-xs leading-relaxed text-muted">{description}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Coming soon badge */}
      <div className="mb-8 rounded-2xl border border-dashed border-lavender/40 bg-lavender/5 p-5 text-center">
        <p className="mb-1 text-xs font-semibold text-lavender">Coming Soon</p>
        <p className="text-sm text-muted">
          Stable Diffusion 기반 3D 가상 성형 시뮬레이션
        </p>
      </div>
    </div>
  );
}
