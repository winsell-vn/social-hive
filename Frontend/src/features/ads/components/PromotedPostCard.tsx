"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transformImageUrl } from "@/lib/image-url";
import { useAdImpressionTracker } from "../hooks/useAdImpressionTracker";
import type { Ad } from "@/types/ad";

interface PromotedPostCardProps {
  ad: Ad;
  className?: string;
}

export function PromotedPostCard({ ad, className }: PromotedPostCardProps) {
  const setRef = useAdImpressionTracker(ad.id);

  const handleCtaClick = () => {
    window.open(ad.ctaLink, "_blank", "noopener,noreferrer");
  };

  const adImageUrl = transformImageUrl(ad.imageUrl);

  return (
    <div ref={setRef}>
      <Card
        className={cn(
          "border-border bg-card hover:shadow-lg transition-shadow duration-200",
          className
        )}
      >
      {/* Header with Sponsored Badge */}
      <CardHeader className="p-4 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500">
              Quảng cáo
            </span>
          </div>
        </div>
        <h3 className="text-base font-semibold text-foreground mt-2 line-clamp-2">
          {ad.title}
        </h3>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-4 pb-3">
        {/* Description - rendered as rich HTML from TipTap editor */}
        {ad.description && (
          <div
            className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3 prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(ad.description),
            }}
          />
        )}

        {/* Image */}
        {adImageUrl && (
          <div className="relative aspect-video overflow-hidden rounded-lg bg-secondary">
            <Image
              src={adImageUrl}
              alt={ad.title}
              fill
              className="object-cover"
              sizes="(max-width: 672px) 100vw, 672px"
            />
          </div>
        )}
      </CardContent>

      {/* CTA Footer */}
      <CardFooter className="p-4 pt-0">
        <Button
          onClick={handleCtaClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transform hover:scale-[1.02] transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="h-4 w-4 ml-2" />
        </Button>
      </CardFooter>
      </Card>
    </div>
  );
}

