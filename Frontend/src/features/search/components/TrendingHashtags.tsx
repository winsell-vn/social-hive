"use client"

import * as React from "react"
import Link from "next/link"
import { TrendingUp } from "lucide-react"
import { useTrendingHashtags } from "../api/search"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"

interface TrendingHashtagsProps {
  limit?: number
  className?: string
}

export function TrendingHashtags({ limit = 10, className }: TrendingHashtagsProps) {
  const { data: hashtags, isLoading } = useTrendingHashtags(limit)

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-facebook-blue" />
            Xu hướng
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!hashtags || hashtags.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-facebook-blue" />
          Xu hướng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {hashtags.map((hashtag, index) => (
          <Link
            key={hashtag.id}
            href={`/hashtag/${hashtag.name}`}
            className="flex items-center justify-between hover:bg-accent -mx-2 px-2 py-2 rounded transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm font-medium w-5 text-center">
                {index + 1}
              </span>
              <span className="text-facebook-blue font-medium hover:underline">
                #{hashtag.name}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">
              {formatNumber(hashtag.postCount)} bài
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

