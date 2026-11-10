"use client"

import * as React from "react"
import { Hash, TrendingUp } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TrendingHashtagCardProps {
  hashtag: {
    id: string
    name: string
    postCount: number
    trendingScore?: number
    samplePosts?: Array<{ id: string; content: string }>
  }
  onClick?: () => void
}

/**
 * TrendingHashtagCard - Displays a trending hashtag with post count,
 * optional hot indicator, and sample post previews
 */
export function TrendingHashtagCard({ hashtag, onClick }: TrendingHashtagCardProps) {
  const isHot = hashtag.trendingScore !== undefined && hashtag.trendingScore > 50

  // Truncate content to 50 characters max
  const truncateContent = (content: string): string => {
    if (content.length <= 50) return content
    return content.slice(0, 50) + "..."
  }

  // Get up to 3 sample posts
  const samplePosts = hashtag.samplePosts?.slice(0, 3) ?? []

  return (
    <Card
      className="p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      {/* Header: Hashtag name and badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-foreground truncate">
            {hashtag.name}
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isHot && (
            <Badge variant="destructive" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              🔥 Hot
            </Badge>
          )}
        </div>
      </div>

      {/* Post count */}
      <div className="text-sm text-muted-foreground mt-1">
        {hashtag.postCount.toLocaleString()} bài viết
      </div>

      {/* Sample posts preview */}
      {samplePosts.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {samplePosts.map((post) => (
            <div
              key={post.id}
              className="text-xs text-muted-foreground truncate"
            >
              {truncateContent(post.content)}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

