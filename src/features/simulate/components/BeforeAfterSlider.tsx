"use client";

import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = "Before",
  afterLabel = "After",
}: BeforeAfterSliderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border shadow-md">
      <ReactCompareSlider
        itemOne={
          <ReactCompareSliderImage
            src={beforeSrc}
            alt="시뮬레이션 전"
            style={{ objectFit: "cover" }}
          />
        }
        itemTwo={
          <ReactCompareSliderImage
            src={afterSrc}
            alt="시뮬레이션 후"
            style={{ objectFit: "cover" }}
          />
        }
        className="aspect-[3/4] w-full max-h-[70vh]"
      />
      <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-mint/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
        {afterLabel}
      </span>
      <p className="pointer-events-none absolute bottom-3 left-0 right-0 text-center text-[10px] text-white/80 drop-shadow">
        ← 드래그하여 비교 →
      </p>
    </div>
  );
}
