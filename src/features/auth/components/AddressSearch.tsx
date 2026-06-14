"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { JusoAddressItem } from "@/features/auth/types/auth.types";

interface AddressSearchProps {
  value: JusoAddressItem | null;
  onSelect: (item: JusoAddressItem) => void;
  className?: string;
}

export function AddressSearch({ value, onSelect, className }: AddressSearchProps) {
  const [keyword, setKeyword] = useState("");
  const [items, setItems] = useState<JusoAddressItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/address/search?keyword=${encodeURIComponent(q.trim())}`,
      );
      const data = await res.json();
      setItems(data.items ?? []);
      setOpen(true);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (keyword.trim().length >= 2) void search(keyword);
    }, 350);
    return () => clearTimeout(t);
  }, [keyword, search]);

  return (
    <div className={cn("relative", className)}>
      <label className="mb-1 block text-[11px] font-medium text-muted">
        도로명 주소 *
      </label>
      <input
        type="text"
        value={value ? value.roadAddr : keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          if (value) onSelect({ roadAddr: "", jibunAddr: "", zipNo: "" });
        }}
        onFocus={() => items.length > 0 && setOpen(true)}
        placeholder="동·로·길 이름으로 검색"
        className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm"
        autoComplete="off"
      />
      {loading && (
        <p className="mt-1 text-[11px] text-muted">주소 검색 중...</p>
      )}
      {value?.roadAddr && (
        <p className="mt-1 text-[11px] text-mint-dark">
          선택됨 · 우편번호 {value.zipNo}
        </p>
      )}
      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-border bg-surface shadow-lg">
          {items.map((item) => (
            <li key={`${item.zipNo}-${item.roadAddr}`}>
              <button
                type="button"
                className="w-full px-3 py-2.5 text-left text-xs hover:bg-foreground/[0.04]"
                onClick={() => {
                  onSelect(item);
                  setKeyword(item.roadAddr);
                  setOpen(false);
                }}
              >
                <span className="font-medium text-foreground">{item.roadAddr}</span>
                <span className="mt-0.5 block text-[10px] text-muted">
                  {item.jibunAddr} · {item.zipNo}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
