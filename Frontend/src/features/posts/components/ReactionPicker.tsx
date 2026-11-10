"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { ReactionType } from "@/types/post"

interface ReactionPickerProps {
  onSelect: (reaction: ReactionType) => void
  currentReaction?: ReactionType | null
  className?: string
}

const reactions: { type: ReactionType; emoji: string; label: string; color: string }[] = [
  { type: 'LIKE', emoji: '👍', label: 'Thích', color: 'text-facebook-blue' },
  { type: 'LOVE', emoji: '❤️', label: 'Yêu thích', color: 'text-red-500' },
  { type: 'HAHA', emoji: '😆', label: 'Haha', color: 'text-yellow-500' },
  { type: 'WOW', emoji: '😮', label: 'Wow', color: 'text-yellow-500' },
  { type: 'SAD', emoji: '😢', label: 'Buồn', color: 'text-yellow-500' },
  { type: 'ANGRY', emoji: '😠', label: 'Phẫn nộ', color: 'text-orange-500' },
]

export function ReactionPicker({ onSelect, currentReaction, className }: ReactionPickerProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 p-2 bg-white rounded-full shadow-lg border",
        className
      )}
    >
      {reactions.map((reaction) => (
        <button
          key={reaction.type}
          onClick={() => onSelect(reaction.type)}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full transition-transform hover:scale-125 hover:bg-gray-100",
            currentReaction === reaction.type && "bg-gray-100 scale-110"
          )}
          title={reaction.label}
        >
          <span className="text-2xl">{reaction.emoji}</span>
        </button>
      ))}
    </div>
  )
}

export function getReactionDisplay(type: ReactionType) {
  const reaction = reactions.find((r) => r.type === type)
  return reaction || reactions[0]
}

export function ReactionButton({
  currentReaction,
  onClick,
  onHover,
  onLeave,
}: {
  currentReaction?: ReactionType | null
  onClick: () => void
  onHover: () => void
  onLeave: () => void
}) {
  const display = currentReaction ? getReactionDisplay(currentReaction) : null

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors",
        display?.color || "text-gray-600"
      )}
    >
      {display ? (
        <>
          <span className="text-lg">{display.emoji}</span>
          <span className="font-medium">{display.label}</span>
        </>
      ) : (
        <>
          <span className="text-lg">👍</span>
          <span className="font-medium">Thích</span>
        </>
      )}
    </button>
  )
}

