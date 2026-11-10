"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, Hash, User, X } from "lucide-react"
import { useSearchSuggestions } from "../api/search"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getAvatarUrl } from "@/lib/image-url"

interface SearchBarProps {
  className?: string
  placeholder?: string
  defaultValue?: string
  onSearch?: (query: string) => void
}

export function SearchBar({
  className,
  placeholder = "Tìm kiếm...",
  defaultValue = "",
  onSearch,
}: SearchBarProps) {
  const router = useRouter()
  const [query, setQuery] = React.useState(defaultValue)
  const [isOpen, setIsOpen] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const { data: suggestions, isLoading } = useSearchSuggestions(query)

  const hasSuggestions = suggestions && (
    suggestions.hashtags.length > 0 || suggestions.users.length > 0
  )

  // Handle click outside to close dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      if (onSearch) {
        onSearch(query.trim())
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleHashtagClick = (name: string) => {
    setIsOpen(false)
    router.push(`/hashtag/${name}`)
  }

  const handleUserClick = (username: string) => {
    setIsOpen(false)
    router.push(`/profile/${username}`)
  }

  const clearQuery = () => {
    setQuery("")
    inputRef.current?.focus()
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setIsOpen(true)
            }}
            onFocus={() => {
              setIsFocused(true)
              if (query.length >= 2) setIsOpen(true)
            }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="pl-10 pr-10 bg-input text-foreground border border-border focus:bg-background focus:ring-2 focus:ring-ring"
          />
          {query && (
            <button
              type="button"
              onClick={clearQuery}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      {/* Suggestions Dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-popover text-popover-foreground rounded-lg shadow-lg border border-border z-50 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">Đang tìm kiếm...</div>
          ) : hasSuggestions ? (
            <div className="py-2">
              {/* Hashtag suggestions */}
              {suggestions.hashtags.length > 0 && (
                <div>
                  <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    Hashtags
                  </div>
                  {suggestions.hashtags.map((hashtag) => (
                    <button
                      key={hashtag.id}
                      onClick={() => handleHashtagClick(hashtag.name)}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-accent text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Hash className="h-4 w-4 text-facebook-blue" />
                      </div>
                      <div>
                        <div className="font-medium text-foreground">#{hashtag.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {hashtag.postCount} bài viết
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* User suggestions */}
              {suggestions.users.length > 0 && (
                <div>
                  <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase">
                    Người dùng
                  </div>
                  {suggestions.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserClick(user.username)}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-accent text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getAvatarUrl(user.avatar)} />
                        <AvatarFallback>
                          <User className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-foreground">
                          {user.displayName || user.username}
                        </div>
                        <div className="text-sm text-muted-foreground">@{user.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              Không tìm thấy kết quả
            </div>
          )}

          {/* Search all link */}
          <button
            onClick={handleSubmit}
            className="w-full px-4 py-3 border-t border-border flex items-center gap-2 hover:bg-accent text-facebook-blue font-medium"
          >
            <Search className="h-4 w-4" />
            Tìm kiếm &quot;{query}&quot;
          </button>
        </div>
      )}
    </div>
  )
}

