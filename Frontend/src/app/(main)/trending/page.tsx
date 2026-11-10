"use client"

import { useState } from "react"
import { FileText, Hash } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  TimeRangeFilter,
  TrendingPostsList,
  TrendingHashtagsList,
  TrendingStats,
  useTrendingPosts,
  useTrendingHashtags,
  type TimeRange,
} from "@/features/trending"

export default function TrendingPage() {
  const [activeTab, setActiveTab] = useState<'posts' | 'hashtags'>('posts')
  const [timeRange, setTimeRange] = useState<TimeRange>('week')

  // Fetch data for stats
  const { data: postsData, isLoading: postsLoading } = useTrendingPosts(timeRange)
  const { data: hashtagsData, isLoading: hashtagsLoading } = useTrendingHashtags(timeRange)

  // Calculate totals
  const totalPosts = postsData?.pages?.[0]?.meta?.total ?? 0
  const totalHashtags = hashtagsData?.length ?? 0
  const statsLoading = postsLoading || hashtagsLoading

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Xu hướng</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Khám phá nội dung đang thịnh hành
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="mb-4">
        <TimeRangeFilter value={timeRange} onChange={setTimeRange} />
      </div>

      {/* Trending Statistics */}
      <TrendingStats
        totalPosts={totalPosts}
        totalHashtags={totalHashtags}
        isLoading={statsLoading}
      />

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'posts' | 'hashtags')}
        className="mb-4"
      >
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="posts" className="gap-2 min-h-[40px]">
            <FileText className="h-4 w-4" />
            Bài viết
          </TabsTrigger>
          <TabsTrigger value="hashtags" className="gap-2 min-h-[40px]">
            <Hash className="h-4 w-4" />
            Hashtags
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts">
          <TrendingPostsList timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="hashtags">
          <TrendingHashtagsList timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

