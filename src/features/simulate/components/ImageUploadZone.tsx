"use client";

import { useCallback, useRef, useState } from "react";
import { ImagePlus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadZoneProps {
  preview: string | null;
  onImageSelect: (file: File, previewUrl: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ImageUploadZone({
  preview,
  onImageSelect,
  onClear,
  disabled,
}: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      onImageSelect(file, url);
    },
    [onImageSelect],
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [disabled, handleFile],
  );

  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="relative aspect-[3/4] max-h-64 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="업로드 미리보기"
            className="h-full w-full object-cover"
          />
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
            aria-label="사진 제거"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 transition-all",
        isDragging
          ? "border-mint bg-mint/5 scale-[1.01]"
          : "border-border bg-surface hover:border-mint/40 hover:bg-mint/5",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/10">
        <ImagePlus className="h-7 w-7 text-mint-dark" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-foreground">
          사진을 드래그하거나 탭하여 업로드
        </p>
        <p className="mt-1 text-xs text-muted">
          정면 얼굴 사진 · JPG, PNG · 최대 8MB
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-xs text-mint-dark">
        <Upload className="h-3.5 w-3.5" />
        <span>업로드</span>
      </div>
    </div>
  );
}
