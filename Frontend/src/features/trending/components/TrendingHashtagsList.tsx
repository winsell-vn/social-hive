"use client"

import { useRouter } from "next/navigation"
import { Hash } from "lucide-react"
import { useTrendingHashtags } from "../api/trending"
import type { TimeRange } from "../types/trending"
import { TrendingHashtagCard } from "./TrendingHashtagCard"
import { Skeleton } from "@/components/ui/skeleton"

interface TrendingHashtagsListProps {
  timeRange: TimeRange
}

export function TrendingHashtagsList({ timeRange }: TrendingHashtagsListProps) {
  const router = useRouter()
  const { data: hashtags, isLoading } = useTrendingHashtags(timeRange, true)

  // Loading state
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-md" />
        ))}
      </div>
    )
  }

  // Empty state
  if (!hashtags || hashtags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Hash className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          Chưa có hashtag thịnh hành
        </h3>
        <p className="text-sm text-muted-foreground">
          Hãy quay lại sau để khám phá xu hướng mới
        </p>
      </div>
    )
  }

  // Data state
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {hashtags.map((hashtag) => (
        <TrendingHashtagCard
          key={hashtag.id}
          hashtag={hashtag}
          onClick={() => router.push(`/hashtag/${hashtag.name}`)}
        />
      ))}
    </div>
  )
}

