"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Download, FileText } from "lucide-react";
import { SimulateDisclaimer } from "@/components/legal/SimulateDisclaimer";
import { Button } from "@/components/ui/Button";
import { AdSlot } from "@/features/ads/components/AdSlot";
import { BeforeAfterSlider } from "@/features/simulate/components/BeforeAfterSlider";
import { ImageUploadZone } from "@/features/simulate/components/ImageUploadZone";
import { SimulationProgress } from "@/features/simulate/components/SimulationProgress";
import { getPatientId } from "@/features/leads/store/leadModalStore";
import { MembershipStatusCard } from "@/features/premium/components/MembershipStatusCard";
import { PremiumPaywallModal } from "@/features/premium/components/PremiumPaywallModal";
import { SkinReportPanel } from "@/features/premium/components/SkinReportPanel";
import {
  useMembershipUsage,
  usePremiumStore,
} from "@/features/premium/store/premiumStore";
import type { SkinReport } from "@/features/premium/types/premium.types";
import type {
  ProcedureType,
  SimulateResponse,
} from "@/features/simulate/types/simulate.types";
import {
  INTENSITY_LABELS,
  PROCEDURE_LABELS,
} from "@/features/simulate/types/simulate.types";
import { cn } from "@/lib/utils";

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.includes(",") ? (result.split(",")[1] ?? result) : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type PaywallFeature = "simulate" | "skin-report";

export function VirtualSimulator() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [procedure, setProcedure] = useState<ProcedureType>("eyes");
  const [intensity, setIntensity] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [loadingIndex, setLoadingIndex] = useState(0);
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [skinReport, setSkinReport] = useState<SkinReport | null>(null);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState<PaywallFeature>("simulate");

  const isPremium = usePremiumStore((s) => s.isPremium);
  const membership = usePremiumStore((s) => s.membership);
  const refreshStatus = usePremiumStore((s) => s.refreshStatus);
  const usage = useMembershipUsage();

  useEffect(() => {
    void refreshStatus();
  }, [refreshStatus]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setInterval(() => {
      setLoadingIndex((i) => i + 1);
    }, 2800);
    return () => clearInterval(timer);
  }, [isLoading]);

  const openPaywall = useCallback((feature: PaywallFeature) => {
    setPaywallFeature(feature);
    setPaywallOpen(true);
  }, []);

  const canSimulateFree =
    isPremium ||
    (usage.simulateLimit !== null && usage.simulateUsed < usage.simulateLimit);

  const handleClear = useCallback(() => {
    setFile(null);
    setPreview(null);
    setResult(null);
  }, []);

  const runSimulate = async () => {
    setIsLoading(true);
    setLoadingIndex(0);
    setResult(null);

    try {
      const imageBase64 = await fileToBase64(file!);
      const userId = getPatientId();

      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          mimeType: file!.type || "image/jpeg",
          procedure,
          intensity,
          user_id: userId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const code = data.code as string | undefined;
        if (code === "PREMIUM_REQUIRED" || code === "QUOTA_EXCEEDED") {
          void refreshStatus();
          openPaywall("simulate");
          return;
        }
        if (code === "RATE_LIMIT") {
          toast.error("API 한도 초과", {
            description: data.error ?? "잠시 후 다시 시도해 주세요.",
          });
        } else if (code === "FACE_NOT_DETECTED") {
          toast.error("얼굴 인식 실패", {
            description: "정면 사진을 다시 업로드해 주세요.",
          });
        } else {
          toast.error("시뮬레이션 실패", {
            description: data.error ?? "다시 시도해 주세요.",
          });
        }
        return;
      }

      const simResult = data as SimulateResponse;
      setResult(simResult);
      void refreshStatus();

      if (simResult.source === "demo") {
        toast.info("데모 모드", {
          description:
            "REPLICATE_API_TOKEN이 없어 원본 이미지로 UI를 확인합니다.",
        });
      } else {
        toast.success("시뮬레이션이 완료되었습니다!");
      }
    } catch {
      toast.error("네트워크 오류", {
        description: "연결을 확인하고 다시 시도해 주세요.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSimulate = async () => {
    if (!file || !preview) {
      toast.error("시뮬레이션할 사진을 먼저 업로드해 주세요.");
      return;
    }

    if (!canSimulateFree) {
      openPaywall("simulate");
      return;
    }

    await runSimulate();
  };

  const handleSkinReport = async () => {
    if (!isPremium) {
      openPaywall("skin-report");
      return;
    }

    setIsReportLoading(true);
    setSkinReport(null);
    try {
      const res = await fetch("/api/skin-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: getPatientId() }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === "PREMIUM_REQUIRED") {
          openPaywall("skin-report");
          return;
        }
        toast.error("리포트 발급 실패", { description: data.error });
        return;
      }

      setSkinReport(data as SkinReport);
      toast.success("피부 정밀 리포트가 발급되었습니다");
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setIsReportLoading(false);
    }
  };

  const handleDownloadResult = () => {
    if (!result || !isPremium) {
      openPaywall("simulate");
      return;
    }
    const link = document.createElement("a");
    link.href = result.afterImage;
    link.download = `prefit-after-${procedure}-${Date.now()}.png`;
    link.click();
  };

  const labels = INTENSITY_LABELS[procedure];

  return (
    <>
      <div className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col gap-5 overflow-y-auto px-4 py-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            가상 성형 시뮬레이터
          </h1>
          <p className="mt-1 text-sm text-muted">
            AI 합성으로 Before / After를 미리 확인하세요
          </p>
        </div>

        <MembershipStatusCard
          membership={membership}
          isPremium={isPremium}
          onUpgrade={() => openPaywall("simulate")}
        />

        <AdSlot placementId="simulate_header_below" />

        <SimulateDisclaimer />

        <div className="flex gap-2 rounded-2xl bg-background p-1">
          {(Object.keys(PROCEDURE_LABELS) as ProcedureType[]).map((key) => (
            <button
              key={key}
              type="button"
              disabled={isLoading}
              onClick={() => {
                setProcedure(key);
                setResult(null);
              }}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-xs font-semibold transition-all",
                procedure === key
                  ? "bg-surface text-mint-dark shadow-sm"
                  : "text-muted hover:text-foreground",
              )}
            >
              {PROCEDURE_LABELS[key]}
            </button>
          ))}
        </div>

        <ImageUploadZone
          preview={preview}
          onImageSelect={(f, url) => {
            setFile(f);
            setPreview(url);
            setResult(null);
          }}
          onClear={handleClear}
          disabled={isLoading}
        />

        <div className="rounded-2xl border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between text-xs">
            <span className="font-medium text-muted">{labels.min}</span>
            <span className="font-semibold text-mint-dark">
              {procedure === "breast"
                ? `${Math.round(250 + (intensity / 100) * 150)}cc`
                : `${intensity}%`}
            </span>
            <span className="font-medium text-muted">{labels.max}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={intensity}
            disabled={isLoading}
            onChange={(e) => {
              setIntensity(Number(e.target.value));
              setResult(null);
            }}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-mint"
          />
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!file || isLoading}
          onClick={() => void handleSimulate()}
        >
          {isLoading
            ? "시뮬레이션 진행 중..."
            : isPremium
              ? "시뮬레이션 시작"
              : canSimulateFree
                ? `무료 시뮬레이션 (${usage.simulateUsed}/${usage.simulateLimit})`
                : "Premium으로 시뮬레이션"}
        </Button>

        <Button
          variant="secondary"
          size="md"
          className="w-full"
          disabled={isReportLoading}
          onClick={() => void handleSkinReport()}
        >
          <FileText className="mr-2 h-4 w-4" />
          {isReportLoading
            ? "리포트 생성 중..."
            : isPremium
              ? "피부 정밀 리포트 발급"
              : "피부 리포트 (Premium)"}
        </Button>

        {skinReport && (
          <SkinReportPanel
            report={skinReport}
            onClose={() => setSkinReport(null)}
          />
        )}

        {isLoading && <SimulationProgress messageIndex={loadingIndex} />}

        {result && !isLoading && (
          <div className="flex flex-col gap-4">
            <SimulateDisclaimer />
            <BeforeAfterSlider
              beforeSrc={result.beforeImage}
              afterSrc={result.afterImage}
              beforeLabel="Before"
              afterLabel="After"
            />
            <div className="rounded-xl bg-mint/5 px-4 py-3 text-xs text-muted">
              <p>
                <span className="font-medium text-mint-dark">적용 강도</span>{" "}
                {Math.round(result.strength * 100)}% ·{" "}
                {result.source === "demo" ? "데모" : "Replicate SD"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={() => {
                  setResult(null);
                  void handleSimulate();
                }}
              >
                다시 시뮬레이션
              </Button>
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={handleDownloadResult}
              >
                <Download className="mr-1.5 h-4 w-4" />
                HD 저장
              </Button>
            </div>
          </div>
        )}

        {!isPremium && (
          <p className="text-center text-[11px] text-muted">
            <Link href="/premium" className="font-medium text-mint-dark underline-offset-2 hover:underline">
              Premium 요금제
            </Link>
            {" "}에서 무제한 시뮬·피부 리포트를 이용하세요
          </p>
        )}
      </div>

      <PremiumPaywallModal
        isOpen={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        featureName={
          paywallFeature === "simulate"
            ? "가상 성형 시뮬레이션"
            : "피부 정밀 리포트"
        }
        onActivated={() => {
          void refreshStatus();
          if (paywallFeature === "simulate" && file) {
            void runSimulate();
          } else if (paywallFeature === "skin-report") {
            void handleSkinReport();
          }
        }}
      />
    </>
  );
}
