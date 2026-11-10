"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { TierBadge } from "./TierBadge"
import type { UserReputation, Tier } from "@/types/reputation"

interface KarmaDisplayProps {
  reputation: UserReputation
  showProgress?: boolean
  showDailyLimit?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

/**
 * KarmaDisplay - Shows user karma, tier badge, and optional progress bar
 * 
 * Usage:
 * <KarmaDisplay reputation={userReputation} showProgress />
 */
export function KarmaDisplay({
  reputation,
  showProgress = false,
  showDailyLimit = false,
  size = "md",
  className,
}: KarmaDisplayProps) {
  const { karma, tier, tierInfo, todayLikeKarma, maxDailyLikeKarma } = reputation

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Karma and Tier */}
      <div className="flex items-center gap-3">
        <div className={cn("font-bold", sizeClasses[size])}>
          <span className="text-gray-600">Karma:</span>{" "}
          <span className="text-facebook-blue">{karma.toLocaleString()}</span>
        </div>
        <TierBadge tier={tier as Tier} size={size} />
      </div>

      {/* Progress to next tier */}
      {showProgress && tier !== "LEGEND" && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{tierInfo.minKarma.toLocaleString()}</span>
            <span>{tierInfo.progress}% đến cấp tiếp theo</span>
            <span>
              {tierInfo.maxKarma === -1 ? "∞" : tierInfo.maxKarma.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-facebook-blue h-2 rounded-full transition-all duration-300"
              style={{ width: `${tierInfo.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Daily like karma limit */}
      {showDailyLimit && (
        <div className="text-xs text-gray-500">
          <span>Karma từ lượt thích hôm nay: </span>
          <span className={todayLikeKarma >= maxDailyLikeKarma ? "text-orange-500" : ""}>
            {todayLikeKarma}/{maxDailyLikeKarma}
          </span>
          {todayLikeKarma >= maxDailyLikeKarma && (
            <span className="ml-1 text-orange-500">(Đã đạt giới hạn)</span>
          )}
        </div>
      )}
    </div>
  )
}

interface KarmaCompactProps {
  karma: number
  tier: Tier
  className?: string
}

/**
 * KarmaCompact - Minimal karma display for headers/cards
 * 
 * Usage:
 * <KarmaCompact karma={1500} tier="EXPERT" />
 */
export function KarmaCompact({ karma, tier, className }: KarmaCompactProps) {
  return (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <TierBadge tier={tier} size="sm" showLabel={false} />
      <span className="font-medium text-gray-700">{karma.toLocaleString()}</span>
    </div>
  )
}

interface KarmaChangeProps {
  points: number
  className?: string
}

/**
 * KarmaChange - Displays karma change with color coding
 * 
 * Usage:
 * <KarmaChange points={10} />  // Shows "+10" in green
 * <KarmaChange points={-5} />  // Shows "-5" in red
 */
export function KarmaChange({ points, className }: KarmaChangeProps) {
  const isPositive = points > 0
  const isNegative = points < 0

  return (
    <span
      className={cn(
        "font-medium",
        isPositive && "text-green-600",
        isNegative && "text-red-600",
        !isPositive && !isNegative && "text-gray-500",
        className
      )}
    >
      {isPositive && "+"}
      {points}
    </span>
  )
}

