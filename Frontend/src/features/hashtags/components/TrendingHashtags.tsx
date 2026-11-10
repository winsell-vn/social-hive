"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"

interface TrendingHashtag {
  id: string
  name: string
  postCount: number
  trendingScore: number
}

export function TrendingHashtags() {
  const { data: hashtags, isLoading } = useQuery({
    queryKey: ['hashtags', 'trending'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: TrendingHashtag[] }>('/hashtags/trending', {
        params: { limit: 10 },
      })
      return response.data.data
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Xu hướng</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex justify-between">
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
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Xu hướng</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hashtags.map((hashtag, index) => (
          <Link
            key={hashtag.id}
            href={`/hashtag/${hashtag.name}`}
            className="flex items-center justify-between hover:bg-gray-50 -mx-2 px-2 py-1 rounded"
          >
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm w-4">{index + 1}</span>
              <span className="text-facebook-blue font-medium">#{hashtag.name}</span>
            </div>
            <span className="text-sm text-gray-500">
              {formatNumber(hashtag.postCount)} bài
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  )
}

