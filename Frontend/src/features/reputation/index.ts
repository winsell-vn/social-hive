// Components
export { TierBadge, TierBadgeInline, getTierDisplay } from './components/TierBadge'
export { KarmaDisplay, KarmaCompact, KarmaChange } from './components/KarmaDisplay'

// API hooks
export {
  reputationKeys,
  useMyReputation,
  useKarmaHistory,
  useTierDefinitions,
} from './api/reputation'

// Re-export types for convenience
export type {
  Tier,
  TierInfo,
  UserReputation,
  KarmaTransaction,
  KarmaActionType,
  TierDefinition,
  TiersResponse,
  PaginatedKarmaHistory,
} from '@/types/reputation'

export { TIER_DISPLAY, KARMA_ACTION_LABELS } from '@/types/reputation'

