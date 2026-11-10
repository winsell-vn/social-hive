"use client";

import * as React from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SearchBar, SearchResults, TrendingHashtags } from "@/features/search";
import type { SearchType } from "@/features/search";

function SearchTips() {
  return (
    <ul className="text-xs text-muted-foreground space-y-2">
      <li className="flex items-start gap-2">
        <span className="text-foreground font-mono font-semibold">#</span>
        <span>Tìm hashtag bằng cách gõ # trước từ khóa</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-foreground font-mono font-semibold">@</span>
        <span>Tìm người dùng bằng cách gõ @ trước tên</span>
      </li>
      <li className="flex items-start gap-2">
        <span className="text-foreground font-mono font-semibold">&quot;&quot;</span>
        <span>Tìm cụm từ chính xác bằng dấu ngoặc kép</span>
      </li>
    </ul>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const type = (searchParams.get("type") as SearchType) || "all";

  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Search Header */}
      <div className="py-4 md:py-6 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {query ? (
              <>
                <h1 className="text-2xl font-semibold truncate">
                  Tìm kiếm &quot;{query}&quot;
                </h1>
              </>
            ) : (
              <h1 className="text-2xl font-semibold">Tìm kiếm</h1>
            )}
          </div>
          {/* Mobile Search Tips - Info Icon with Popover */}
          <div className="lg:hidden flex-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Mẹo tìm kiếm"
                >
                  <Info className="h-5 w-5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-72">
                <h4 className="font-semibold mb-3 text-sm">Mẹo tìm kiếm</h4>
                <SearchTips />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* Search Bar */}
        <div className="mt-4">
          <SearchBar
            defaultValue={query}
            placeholder="Tìm kiếm bài viết, người dùng, hashtag..."
            className="max-w-2xl"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="py-6">
        {query ? (
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            {/* Main Content */}
            <div className="min-w-0">
              <SearchResults query={query} initialType={type} />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden lg:block space-y-4">
              <div className="sticky top-20">
                {/* Search Tips Card */}
                <Card className="rounded-lg border border-border bg-card">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 text-sm">Mẹo tìm kiếm</h3>
                    <SearchTips />
                  </CardContent>
                </Card>

                {/* Trending Hashtags */}
                <div className="mt-4">
                  <TrendingHashtags limit={8} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty State - No Query */
          <div className="py-12 text-center">
            <div className="mb-4">
              <Search
                className="h-16 w-16 mx-auto text-muted-foreground opacity-50"
                strokeWidth={1}
              />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              Tìm kiếm ChungToiXayWeb
            </h2>
            <p className="text-sm text-muted-foreground mb-8">
              Tìm bài viết, người dùng, hashtag và nhóm
            </p>

            {/* Trending on mobile when no query */}
            <div className="max-w-md mx-auto">
              <TrendingHashtags limit={6} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchPageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4">
      {/* Header Skeleton */}
      <div className="py-4 md:py-6 border-b border-border">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-10 w-full max-w-2xl" />
      </div>

      {/* Content Skeleton */}
      <div className="py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
          <div className="space-y-4">
            {/* Tabs Skeleton */}
            <Skeleton className="h-11 w-full" />
            {/* Cards Skeleton */}
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="hidden lg:block space-y-4">
            <Card>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-24" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageContent />
    </Suspense>
  );
}
