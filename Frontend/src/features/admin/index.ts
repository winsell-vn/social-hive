// Types
export * from './types/admin';

// API hooks
export * from './api/admin';
export {
  // Types (excluding PaginatedResponse which conflicts with admin types)
  type AiProviderKey,
  type AiProviderProtocol,
  type AiAgent,
  type ActivityLog,
  type ActivityStats,
  type QueueStatus,
  type DashboardData,
  type AgentFilters,
  type CreateApiKeyData,
  type UpdateApiKeyData,
  type CreateAgentData,
  // Query keys
  aiSeedingKeys,
  // Constants
  AI_PROVIDER_PROTOCOLS,
  // Hooks
  useAiSeedingDashboard,
  useApiKeys,
  useCreateApiKey,
  useUpdateApiKey,
  useDeleteApiKey,
  useTestApiKey,
  useAiAgents,
  useCreateAgent,
  useUpdateAgent,
  useDeleteAgent,
  usePauseAgent,
  useResumeAgent,
  useTriggerAgentAction,
  useQueueStatus,
  useActivityLogs,
} from './api/ai-seeding.api';

// Components
export { AdminSidebar } from './components/AdminSidebar';
export { StatsCard } from './components/StatsCard';
export { PostReviewCard, PostReviewCardSkeleton } from './components/PostReviewCard';
export { ModerationQueue } from './components/ModerationQueue';
export { UserTable } from './components/UserTable';

// Pages
export { AiSeedingPage } from './pages/AiSeedingPage';
export { AiApiKeysPage } from './pages/AiApiKeysPage';
export { AiAgentsPage } from './pages/AiAgentsPage';
export { EmailConfigPage } from './pages/EmailConfigPage';

// Email settings API
export {
  useEmailConfig,
  useUpdateEmailConfig,
  useTestEmail,
  emailConfigKeys,
  type EmailConfig,
  type UpdateEmailConfigDto,
  type TestEmailResult,
} from './api/email-config';

