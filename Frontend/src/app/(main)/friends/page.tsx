"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Users, UserPlus, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginPromptModal } from "@/features/auth/components/LoginPromptModal";
import {
  FriendsList,
  FriendRequestCard,
  FriendSuggestionCard,
  usePendingRequests,
  useFriendSuggestions,
  useFriendCounts,
} from "@/features/friends";

type TabValue = "friends" | "requests" | "suggestions";

function FriendsPageContent() {
  const [activeTab, setActiveTab] = React.useState<TabValue>("friends");
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // Lazy load: only fetch data for the active tab
  const { data: pendingRequests, isLoading: isLoadingRequests } =
    usePendingRequests({ enabled: activeTab === "requests" });
  const { data: suggestions, isLoading: isLoadingSuggestions } =
    useFriendSuggestions({ enabled: activeTab === "suggestions" });

  // Counts are fetched once on page load for badge display
  const { data: counts } = useFriendCounts();

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const incomingCount = pendingRequests?.incoming?.length ?? 0;
  const outgoingCount = pendingRequests?.outgoing?.length ?? 0;

  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bạn bè</h1>
        <p className="text-muted-foreground">
          Quản lý danh sách bạn bè và lời mời kết bạn
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabValue)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Bạn bè</span>
            {counts?.friends !== undefined && counts.friends > 0 && (
              <Badge variant="secondary" className="ml-1">
                {counts.friends}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Lời mời</span>
            {counts?.pendingReceived !== undefined && counts.pendingReceived > 0 && (
              <Badge variant="destructive" className="ml-1">
                {counts.pendingReceived}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="suggestions" className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Gợi ý</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm bạn bè..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <FriendsList search={debouncedSearch} enabled={activeTab === "friends"} />
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {/* Incoming requests */}
          <div>
            <h3 className="font-medium mb-3">
              Lời mời đã nhận ({incomingCount})
            </h3>
            {isLoadingRequests ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : incomingCount === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Không có lời mời kết bạn nào
              </p>
            ) : (
              <div className="space-y-1">
                {pendingRequests?.incoming.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    type="incoming"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Outgoing requests */}
          <div>
            <h3 className="font-medium mb-3">
              Lời mời đã gửi ({outgoingCount})
            </h3>
            {isLoadingRequests ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : outgoingCount === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Bạn chưa gửi lời mời kết bạn nào
              </p>
            ) : (
              <div className="space-y-1">
                {pendingRequests?.outgoing.map((request) => (
                  <FriendRequestCard
                    key={request.id}
                    request={request}
                    type="outgoing"
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <h3 className="font-medium">Những người bạn có thể biết</h3>
          {isLoadingSuggestions ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : !suggestions || suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Không có gợi ý kết bạn nào
            </p>
          ) : (
            <div className="space-y-1">
              {suggestions.map((suggestion) => (
                <FriendSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function FriendsPage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();

  const handleClose = () => {
    router.push('/');
  };

  // Show loading while hydrating
  if (!hydrated) {
    return (
      <div className="container max-w-4xl py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Bạn bè</h1>
          <p className="text-muted-foreground">
            Quản lý danh sách bạn bè và lời mời kết bạn
          </p>
        </div>
        <div className="text-center text-muted-foreground">Đang tải...</div>
      </div>
    );
  }

  return (
    <>
      <FriendsPageContent />

      {/* Show modal if not authenticated - closes and redirects to home */}
      <LoginPromptModal
        open={!isAuthenticated}
        onClose={handleClose}
        message="Vui lòng đăng nhập để xem danh sách bạn bè"
      />
    </>
  );
}

