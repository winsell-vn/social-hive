-- Generalize AI provider keys.
--
-- The table is RENAMED instead of dropped so existing API keys, their usage
-- counters and every agent binding (ai_agent.apiKeyId) survive the change.
-- The foreign key follows the renamed table automatically.

ALTER TABLE `groq_api_key` RENAME TO `ai_provider_key`;

-- Provider configuration: any OpenAI-compatible endpoint, not just Groq.
ALTER TABLE `ai_provider_key`
    ADD COLUMN `baseUrl` VARCHAR(191) NOT NULL DEFAULT 'https://api.groq.com/openai/v1',
    ADD COLUMN `modelId` VARCHAR(191) NOT NULL DEFAULT 'llama-3.1-8b-instant',
    ADD COLUMN `protocol` ENUM('OPENAI_CHAT_COMPLETION','OPENAI_RESPONSE') NOT NULL DEFAULT 'OPENAI_CHAT_COMPLETION';

-- Keep index names in sync with the new table name (Prisma derives them from
-- the mapped table name).
ALTER TABLE `ai_provider_key`
    DROP INDEX `groq_api_key_isActive_idx`,
    DROP INDEX `groq_api_key_deletedAt_idx`,
    ADD INDEX `ai_provider_key_isActive_idx` (`isActive`),
    ADD INDEX `ai_provider_key_deletedAt_idx` (`deletedAt`);
