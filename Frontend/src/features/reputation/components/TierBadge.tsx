"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { Tier } from "@/types/reputation"
import { TIER_DISPLAY } from "@/types/reputation"

interface TierBadgeProps {
  tier: Tier
  size?: "sm" | "md" | "lg"
  showLabel?: boolean
  className?: string
}

/**
 * TierBadge - Displays user tier with icon and optional label
 * 
 * Usage:
 * <TierBadge tier="LEGEND" />
 * <TierBadge tier="EXPERT" size="lg" showLabel />
 */
export function TierBadge({
  tier,
  size = "md",
  showLabel = true,
  className,
}: TierBadgeProps) {
  const display = TIER_DISPLAY[tier] || TIER_DISPLAY.NEWCOMER

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  }

  const iconSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        display.bgColor,
        display.color,
        sizeClasses[size],
        className
      )}
      title={`${display.label} tier`}
    >
      <span className={iconSizes[size]}>{display.icon}</span>
      {showLabel && <span>{display.label}</span>}
    </span>
  )
}

interface TierBadgeInlineProps {
  tier: Tier
  className?: string
}

/**
 * TierBadgeInline - Minimal inline tier icon for use next to usernames
 * 
 * Usage:
 * <span>Username <TierBadgeInline tier="MASTER" /></span>
 */
export function TierBadgeInline({ tier, className }: TierBadgeInlineProps) {
  const display = TIER_DISPLAY[tier] || TIER_DISPLAY.NEWCOMER

  return (
    <span
      className={cn("inline-block", className)}
      title={`${display.label} tier`}
    >
      {display.icon}
    </span>
  )
}

/**
 * Get tier display info for custom rendering
 */
export function getTierDisplay(tier: Tier) {
  return TIER_DISPLAY[tier] || TIER_DISPLAY.NEWCOMER
}

