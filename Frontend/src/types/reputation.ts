/**
 * Reputation system types
 * Matches backend DTOs from Backend/src/modules/reputation/dto/reputation.dto.ts
 */

export type Tier = 'NEWCOMER' | 'CONTRIBUTOR' | 'EXPERT' | 'MASTER' | 'LEGEND'

export type KarmaActionType =
  | 'POST_APPROVED'
  | 'POST_REJECTED'
  | 'RECEIVED_LIKE'
  | 'LIKE_MILESTONE'
  | 'COMMENT_RECEIVED'
  | 'DAILY_LOGIN'
  | 'SPAM_DELETED'
  | 'KARMA_DECAY'
  | 'ADMIN_ADJUSTMENT'

export interface TierInfo {
  icon: string
  label: string
  multiplier: number
  minKarma: number
  maxKarma: number // -1 for infinity (Legend tier)
  progress: number // Percentage to next tier (0-100)
}

export interface UserReputation {
  karma: number
  tier: Tier
  tierInfo: TierInfo
  todayLikeKarma: number
  maxDailyLikeKarma: number
}

export interface KarmaTransaction {
  id: string
  action: KarmaActionType
  points: number
  metadata: Record<string, unknown> | null
  createdAt: string
}

export interface TierDefinition {
  tier: Tier
  icon: string
  label: string
  minKarma: number
  maxKarma: number // -1 for infinity
  multiplier: number
  privileges: string[]
}

export interface TiersResponse {
  tiers: TierDefinition[]
}

export interface PaginatedKarmaHistory {
  data: KarmaTransaction[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

/**
 * Tier display configuration for UI components
 */
export const TIER_DISPLAY: Record<Tier, { icon: string; label: string; color: string; bgColor: string }> = {
  NEWCOMER: {
    icon: '🌱',
    label: 'Newcomer',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
  },
  CONTRIBUTOR: {
    icon: '⭐',
    label: 'Regular',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
  },
  EXPERT: {
    icon: '🏅',
    label: 'Trusted',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
  },
  MASTER: {
    icon: '💎',
    label: 'Veteran',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
  },
  LEGEND: {
    icon: '👑',
    label: 'Legend',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
  },
}

/**
 * Karma action display labels (Vietnamese)
 */
export const KARMA_ACTION_LABELS: Record<KarmaActionType, string> = {
  POST_APPROVED: 'Bài viết được duyệt',
  POST_REJECTED: 'Bài viết bị từ chối',
  RECEIVED_LIKE: 'Nhận được lượt thích',
  LIKE_MILESTONE: 'Đạt mốc lượt thích',
  COMMENT_RECEIVED: 'Nhận được bình luận',
  DAILY_LOGIN: 'Đăng nhập hàng ngày',
  SPAM_DELETED: 'Bài viết bị xóa do spam',
  KARMA_DECAY: 'Giảm karma do không hoạt động',
  ADMIN_ADJUSTMENT: 'Điều chỉnh bởi quản trị viên',
}

