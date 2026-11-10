"use client";

import * as React from "react";
import Image from "next/image";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transformImageUrl } from "@/lib/image-url";
import { stripHtmlTags } from "@/lib/seo";
import { useAdImpressionTracker } from "../hooks/useAdImpressionTracker";
import type { Ad } from "@/types/ad";

interface SidebarAdCardProps {
  ad: Ad;
  className?: string;
}

export function SidebarAdCard({ ad, className }: SidebarAdCardProps) {
  const setRef = useAdImpressionTracker(ad.id);

  const handleCtaClick = () => {
    window.open(ad.ctaLink, "_blank", "noopener,noreferrer");
  };

  const adImageUrl = transformImageUrl(ad.imageUrl);

  return (
    <div ref={setRef}>
      <Card
        className={cn(
          "border-border bg-card hover:shadow-lg transition-shadow duration-200 max-w-[300px] overflow-hidden",
          className
        )}
      >
      {/* Image */}
      {adImageUrl && (
        <div className="relative w-full bg-secondary">
          <Image
            src={adImageUrl}
            alt={ad.title}
            width={600}
            height={400}
            className="w-full h-auto rounded-t-lg"
            sizes="300px"
          />
          {/* Sponsored Badge Overlay */}
          <div className="absolute top-2 left-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100/90 text-amber-700 backdrop-blur-sm">
              Quảng cáo
            </span>
          </div>
        </div>
      )}

      <CardContent className="p-3">
        {/* Sponsored Badge (if no image) */}
        {!adImageUrl && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-500 mb-2">
            Quảng cáo
          </span>
        )}

        {/* Title */}
        <h4 className="text-sm font-semibold text-foreground line-clamp-2 mb-1">
          {ad.title}
        </h4>

        {/* Description - stripped of HTML for compact sidebar view */}
        {ad.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
            {stripHtmlTags(ad.description)}
          </p>
        )}

        {/* CTA Button */}
        <Button
          onClick={handleCtaClick}
          size="sm"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transform hover:scale-[1.02] transition-all duration-200 focus:ring-2 focus:ring-blue-500"
        >
          <span>{ad.ctaText}</span>
          <ExternalLink className="h-3 w-3 ml-1.5" />
        </Button>
      </CardContent>
      </Card>
    </div>
  );
}

