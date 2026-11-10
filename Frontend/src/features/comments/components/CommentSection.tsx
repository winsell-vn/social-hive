"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatRelativeTime, getInitials } from "@/lib/utils"
import { generateAvatarAlt } from "@/lib/seo/alt-text"
import { getAvatarUrl } from "@/lib/image-url"
import type { Comment, CreateCommentInput } from "@/types/comment"

interface CommentItemProps {
  comment: Comment
  onReply?: (commentId: string, content: string) => void
  onDelete?: (commentId: string) => void
  currentUserId?: string
  isAuthenticated?: boolean
}

export function CommentItem({ comment, onReply, onDelete, currentUserId, isAuthenticated }: CommentItemProps) {
  const [showReplyInput, setShowReplyInput] = React.useState(false)
  const [replyContent, setReplyContent] = React.useState("")

  const handleReply = () => {
    if (replyContent.trim()) {
      onReply?.(comment.id, replyContent.trim())
      setReplyContent("")
      setShowReplyInput(false)
    }
  }

  // Handle Enter key to submit reply (Shift+Enter for new line)
  const handleReplyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleReply()
    }
  }

  const handleReplyClick = () => {
    if (!isAuthenticated) {
      // Will be handled by parent component's auth check
      return
    }
    setShowReplyInput(!showReplyInput)
  }

  return (
    <div className="flex gap-2">
      <Link href={`/profile/${comment.author.username}`}>
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={getAvatarUrl(comment.author.profile.avatar)}
            alt={generateAvatarAlt(comment.author.profile.displayName || "Người dùng")}
          />
          <AvatarFallback>{getInitials(comment.author.profile.displayName)}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1">
        <div className="bg-gray-100 dark:bg-slate-800 rounded-2xl px-3 py-2">
          <Link
            href={`/profile/${comment.author.username}`}
            className="font-semibold text-sm hover:underline"
          >
            {comment.author.profile.displayName}
          </Link>
          <p className="text-sm">{comment.content}</p>
        </div>

        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-slate-400">
          <span>{formatRelativeTime(comment.createdAt)}</span>
          <button className="font-semibold hover:underline">Thích</button>
          <button
            className="font-semibold hover:underline"
            onClick={handleReplyClick}
          >
            Phản hồi
          </button>
          {comment._count.likes > 0 && (
            <span>👍 {comment._count.likes}</span>
          )}
          {currentUserId === comment.authorId && (
            <button
              className="font-semibold hover:underline text-red-500"
              onClick={() => onDelete?.(comment.id)}
            >
              Xóa
            </button>
          )}
        </div>

        {showReplyInput && isAuthenticated && (
          <div className="flex gap-2 mt-2">
            <Textarea
              placeholder="Viết phản hồi... (Enter để gửi, Shift+Enter để xuống dòng)"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={handleReplyKeyDown}
              className="min-h-[60px] text-sm"
            />
            <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
              Gửi
            </Button>
          </div>
        )}

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
                onDelete={onDelete}
                currentUserId={currentUserId}
                isAuthenticated={isAuthenticated}
              />
            ))}
          </div>
        )}

        {comment._count.replies > (comment.replies?.length || 0) && (
          <button className="text-sm text-facebook-blue hover:underline mt-1">
            Xem thêm {comment._count.replies - (comment.replies?.length || 0)} phản hồi
          </button>
        )}
      </div>
    </div>
  )
}

interface CommentSectionProps {
  postId: string
  comments: Comment[]
  onAddComment: (postId: string, data: CreateCommentInput) => void
  onDeleteComment?: (commentId: string) => void
  currentUserId?: string
  user?: {
    displayName: string
    avatar: string | null
  }
  hasMore?: boolean
  onLoadMore?: () => void
  isAuthenticated?: boolean
  commentInputRef?: React.RefObject<HTMLTextAreaElement>
  isAuthLoading?: boolean
}

export function CommentSection({
  postId,
  comments,
  onAddComment,
  onDeleteComment,
  currentUserId,
  user,
  hasMore,
  onLoadMore,
  isAuthenticated = false,
  commentInputRef,
  isAuthLoading = false,
}: CommentSectionProps) {
  const [newComment, setNewComment] = React.useState("")
  const internalTextareaRef = React.useRef<HTMLTextAreaElement>(null)

  // Use provided ref or internal ref
  const textareaRef = commentInputRef || internalTextareaRef

  const handleSubmit = () => {
    if (newComment.trim()) {
      onAddComment(postId, { content: newComment.trim() })
      setNewComment("")
      // Reset textarea height after submit
      if (textareaRef.current) {
        textareaRef.current.style.height = "40px"
      }
    }
  }

  // Handle Enter key to submit (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Auto-resize textarea based on content
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto"
    // Set height to scrollHeight, with min and max constraints
    const newHeight = Math.min(Math.max(textarea.scrollHeight, 40), 200)
    textarea.style.height = `${newHeight}px`
    setNewComment(textarea.value)
  }

  const handleReply = (parentId: string, content: string) => {
    onAddComment(postId, { content, parentId })
  }

  return (
    <div className="space-y-3 p-4 border-t">
      {/* Section heading for SEO (AC-011) */}
      <h2 className="text-lg font-semibold">Bình luận</h2>

      {/* Comment input - show loading while auth is hydrating, login prompt for guests, form for logged in users */}
      {isAuthLoading ? (
        <div className="flex items-center justify-center py-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
            <p className="text-sm text-gray-500 dark:text-slate-400">Đang tải...</p>
          </div>
        </div>
      ) : user ? (
        <div className="flex gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src={getAvatarUrl(user.avatar)} />
            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Viết bình luận... (Enter để gửi, Shift+Enter để xuống dòng)"
              value={newComment}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              className="min-h-[40px] max-h-[200px] text-sm resize-none overflow-y-auto"
              style={{ height: "40px" }}
            />
            <Button size="sm" onClick={handleSubmit} disabled={!newComment.trim()}>
              Gửi
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center py-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-slate-400">
            <Link href="/login" className="text-primary hover:underline font-medium">
              Đăng nhập
            </Link>
            {" "}để bình luận
          </p>
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onReply={handleReply}
            onDelete={onDeleteComment}
            currentUserId={currentUserId}
            isAuthenticated={isAuthenticated}
          />
        ))}
      </div>

      {hasMore && (
        <button
          className="text-sm text-facebook-blue hover:underline"
          onClick={onLoadMore}
        >
          Xem thêm bình luận
        </button>
      )}
    </div>
  )
}

