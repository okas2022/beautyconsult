"use client";

import { Check, Minus } from "lucide-react";
import {
  PLAN_FEATURE_COMPARISON,
  type PlanFeature,
} from "@/features/premium/constants/plans";
import { cn } from "@/lib/utils";

function FeatureCell({ value }: { value: string | boolean }) {
  if (value === true) {
    return <Check className="mx-auto h-4 w-4 text-mint-dark" strokeWidth={2.5} />;
  }
  if (value === false) {
    return <Minus className="mx-auto h-4 w-4 text-muted/40" strokeWidth={2} />;
  }
  return (
    <span className="text-[10px] font-medium leading-tight text-foreground/80">
      {value}
    </span>
  );
}

function FeatureRow({ feature }: { feature: PlanFeature }) {
  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-2.5 pr-2 text-[11px] leading-snug text-muted">
        {feature.label}
      </td>
      <td className="w-16 py-2.5 text-center">
        <FeatureCell value={feature.free} />
      </td>
      <td className="w-16 py-2.5 text-center">
        <FeatureCell value={feature.premium} />
      </td>
    </tr>
  );
}

interface PlanComparisonTableProps {
  className?: string;
  compact?: boolean;
}

export function PlanComparisonTable({
  className,
  compact,
}: PlanComparisonTableProps) {
  const features = compact
    ? PLAN_FEATURE_COMPARISON.slice(0, 4)
    : PLAN_FEATURE_COMPARISON;

  return (
    <div className={cn("overflow-hidden rounded-2xl border border-border/70", className)}>
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-border/60 bg-background/80 text-[10px] font-semibold uppercase tracking-wide text-muted">
            <th className="px-3 py-2.5">기능</th>
            <th className="w-16 px-1 py-2.5 text-center">Free</th>
            <th className="w-16 px-1 py-2.5 text-center text-mint-dark">Premium</th>
          </tr>
        </thead>
        <tbody className="px-3">
          {features.map((f) => (
            <FeatureRow key={f.id} feature={f} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
