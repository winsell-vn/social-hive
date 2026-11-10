import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TrendingStatsProps {
  totalPosts: number;
  totalHashtags: number;
  isLoading?: boolean;
}

export function TrendingStats({
  totalPosts,
  totalHashtags,
  isLoading,
}: TrendingStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      <Card className="p-3 text-center">
        {isLoading ? (
          <Skeleton className="h-8 w-12 mx-auto mb-1" />
        ) : (
          <div className="text-2xl font-bold text-foreground">{totalPosts}</div>
        )}
        <div className="text-xs text-muted-foreground">Bài viết thịnh hành</div>
      </Card>

      <Card className="p-3 text-center">
        {isLoading ? (
          <Skeleton className="h-8 w-12 mx-auto mb-1" />
        ) : (
          <div className="text-2xl font-bold text-foreground">
            {totalHashtags}
          </div>
        )}
        <div className="text-xs text-muted-foreground">Hashtags thịnh hành</div>
      </Card>
    </div>
  );
}

