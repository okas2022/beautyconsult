"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { ExternalLink, ShoppingBag } from "lucide-react";
import type { Product } from "@/features/commerce/types/product.types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  return (
    <motion.a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "flex gap-3 overflow-hidden rounded-2xl border border-lavender/30 bg-gradient-to-br from-lavender/5 to-surface p-3 shadow-sm",
        "transition hover:shadow-md active:scale-[0.99]",
        className,
      )}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-muted/10">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          className="object-cover"
          sizes="64px"
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-1">
          <ShoppingBag className="h-3 w-3 text-lavender" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-lavender">
            추천 제품
          </span>
        </div>
        <p className="text-sm font-semibold text-foreground line-clamp-1">
          {product.name}
        </p>
        {product.description && (
          <p className="mt-0.5 text-[11px] text-muted line-clamp-2">
            {product.description}
          </p>
        )}
        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-mint-dark">
          구매하기
          <ExternalLink className="h-3 w-3" />
        </span>
      </div>
    </motion.a>
  );
}
