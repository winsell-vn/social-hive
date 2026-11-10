-- CreateTable
CREATE TABLE `comment` (
    `id` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `parentId` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `likeCount` INTEGER NOT NULL DEFAULT 0,
    `depth` INTEGER NOT NULL DEFAULT 0,
    `editedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Comment_authorId_idx`(`authorId`),
    INDEX `Comment_createdAt_idx`(`createdAt`),
    INDEX `Comment_parentId_idx`(`parentId`),
    INDEX `Comment_postId_idx`(`postId`),
    UNIQUE INDEX `Comment_authorId_postId_parentId_unique`(`authorId`, `postId`, `parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emailverification` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `verifiedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EmailVerification_token_key`(`token`),
    INDEX `EmailVerification_email_idx`(`email`),
    INDEX `EmailVerification_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `follow` (
    `id` VARCHAR(191) NOT NULL,
    `followerId` VARCHAR(191) NOT NULL,
    `followingId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Follow_followerId_idx`(`followerId`),
    INDEX `Follow_followingId_idx`(`followingId`),
    UNIQUE INDEX `Follow_followerId_followingId_key`(`followerId`, `followingId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hashtag` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `postCount` INTEGER NOT NULL DEFAULT 0,
    `trendingScore` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Hashtag_name_key`(`name`),
    INDEX `Hashtag_name_idx`(`name`),
    INDEX `Hashtag_trendingScore_idx`(`trendingScore`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `like` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `postId` VARCHAR(191) NULL,
    `commentId` VARCHAR(191) NULL,
    `reactionType` ENUM('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY') NOT NULL DEFAULT 'LIKE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Like_commentId_idx`(`commentId`),
    INDEX `Like_postId_idx`(`postId`),
    UNIQUE INDEX `Like_userId_commentId_key`(`userId`, `commentId`),
    UNIQUE INDEX `Like_userId_postId_key`(`userId`, `postId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` ENUM('POST_APPROVED', 'POST_REJECTED', 'POST_LIKED', 'POST_COMMENTED', 'COMMENT_REPLIED', 'NEW_FOLLOWER', 'MENTION', 'KARMA_MILESTONE', 'FRIEND_REQUEST_RECEIVED', 'FRIEND_REQUEST_ACCEPTED', 'CHATBOT_HANDOFF') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `data` LONGTEXT NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_createdAt_idx`(`createdAt`),
    INDEX `Notification_userId_isRead_idx`(`userId`, `isRead`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `passwordreset` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PasswordReset_token_key`(`token`),
    INDEX `PasswordReset_email_idx`(`email`),
    INDEX `PasswordReset_token_idx`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post` (
    `id` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `images` LONGTEXT NULL,
    `slug` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED') NOT NULL DEFAULT 'PENDING',
    `moderatorId` VARCHAR(191) NULL,
    `moderatorNote` VARCHAR(191) NULL,
    `publishAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `likeCount` INTEGER NOT NULL DEFAULT 0,
    `commentCount` INTEGER NOT NULL DEFAULT 0,
    `shareCount` INTEGER NOT NULL DEFAULT 0,
    `sharedPostId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Post_authorId_idx`(`authorId`),
    INDEX `Post_createdAt_idx`(`createdAt`),
    INDEX `Post_sharedPostId_idx`(`sharedPostId`),
    INDEX `Post_status_idx`(`status`),
    INDEX `Post_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `Post_status_publishAt_idx`(`status`, `publishAt`),
    INDEX `Post_trending_idx`(`status`, `publishAt`, `likeCount`),
    INDEX `Post_updatedAt_idx`(`updatedAt`),
    INDEX `Post_slug_idx`(`slug`),
    UNIQUE INDEX `Post_authorId_slug_key`(`authorId`, `slug`),
    FULLTEXT INDEX `Post_content_idx`(`content`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posthashtag` (
    `postId` VARCHAR(191) NOT NULL,
    `hashtagId` VARCHAR(191) NOT NULL,

    INDEX `PostHashtag_hashtagId_fkey`(`hashtagId`),
    PRIMARY KEY (`postId`, `hashtagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profile` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `displayName` VARCHAR(191) NULL,
    `avatar` VARCHAR(191) NULL,
    `coverPhoto` VARCHAR(191) NULL,
    `bio` VARCHAR(500) NULL,
    `location` VARCHAR(100) NULL,
    `website` VARCHAR(255) NULL,
    `socialLinks` LONGTEXT NULL,
    `portfolio` LONGTEXT NULL,
    `isPrivate` BOOLEAN NOT NULL DEFAULT false,
    `lastUsernameChange` DATETIME(3) NULL,
    `closeFriends` LONGTEXT NULL,
    `followerCount` INTEGER NOT NULL DEFAULT 0,
    `followingCount` INTEGER NOT NULL DEFAULT 0,
    `jobTitle` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `expertise` JSON NULL,
    `credentials` JSON NULL,
    `isVerifiedExpert` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Profile_userId_key`(`userId`),
    UNIQUE INDEX `Profile_username_key`(`username`),
    INDEX `Profile_username_idx`(`username`),
    INDEX `Profile_updatedAt_idx`(`updatedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reputationtransaction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `points` INTEGER NOT NULL,
    `metadata` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReputationTransaction_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `refreshToken` VARCHAR(191) NOT NULL,
    `deviceInfo` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,
    `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `rememberMe` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Session_refreshToken_key`(`refreshToken`),
    INDEX `Session_refreshToken_idx`(`refreshToken`),
    INDEX `Session_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` ENUM('GUEST', 'USER', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER',
    `karma` INTEGER NOT NULL DEFAULT 0,
    `tier` ENUM('NEWCOMER', 'CONTRIBUTOR', 'EXPERT', 'MASTER', 'LEGEND') NOT NULL DEFAULT 'NEWCOMER',
    `isActive` BOOLEAN NOT NULL DEFAULT false,
    `isAiAgent` BOOLEAN NOT NULL DEFAULT false,
    `lastActiveAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletionRequestedAt` DATETIME(3) NULL,
    `deletionScheduledFor` DATETIME(3) NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_email_idx`(`email`),
    INDEX `User_karma_idx`(`karma`),
    INDEX `User_tier_idx`(`tier`),
    INDEX `User_isAiAgent_idx`(`isAiAgent`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_settings` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `profileVisibility` ENUM('PUBLIC', 'FRIENDS', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
    `showActivityStatus` BOOLEAN NOT NULL DEFAULT true,
    `emailNotifications` BOOLEAN NOT NULL DEFAULT true,
    `pushNotifications` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnLike` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnComment` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnFollow` BOOLEAN NOT NULL DEFAULT true,
    `notifyOnMention` BOOLEAN NOT NULL DEFAULT true,
    `twoFactorEnabled` BOOLEAN NOT NULL DEFAULT false,
    `twoFactorSecret` VARCHAR(191) NULL,
    `backupCodes` TEXT NULL,
    `lastPasswordChange` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `UserSettings_userId_key`(`userId`),
    INDEX `UserSettings_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `friendrequest` (
    `id` VARCHAR(191) NOT NULL,
    `senderId` VARCHAR(191) NOT NULL,
    `receiverId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `friendrequest_senderId_status_idx`(`senderId`, `status`),
    INDEX `friendrequest_receiverId_status_idx`(`receiverId`, `status`),
    UNIQUE INDEX `friendrequest_senderId_receiverId_key`(`senderId`, `receiverId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_provider_key` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `encryptedKey` TEXT NOT NULL,
    `iv` VARCHAR(191) NOT NULL,
    `baseUrl` VARCHAR(191) NOT NULL DEFAULT 'https://api.groq.com/openai/v1',
    `modelId` VARCHAR(191) NOT NULL DEFAULT 'llama-3.1-8b-instant',
    `protocol` ENUM('OPENAI_CHAT_COMPLETION', 'OPENAI_RESPONSE') NOT NULL DEFAULT 'OPENAI_CHAT_COMPLETION',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `usageToday` INTEGER NOT NULL DEFAULT 0,
    `usageTotal` INTEGER NOT NULL DEFAULT 0,
    `lastUsedAt` DATETIME(3) NULL,
    `lastResetAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `maxAgents` INTEGER NOT NULL DEFAULT 10,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ai_provider_key_isActive_idx`(`isActive`),
    INDEX `ai_provider_key_deletedAt_idx`(`deletedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_agent` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `apiKeyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `personality` TEXT NOT NULL,
    `systemPrompt` TEXT NOT NULL,
    `status` ENUM('ACTIVE', 'PAUSED', 'DISABLED') NOT NULL DEFAULT 'ACTIVE',
    `activityWindow` TEXT NULL,
    `postFrequency` INTEGER NOT NULL DEFAULT 3,
    `commentFrequency` INTEGER NOT NULL DEFAULT 10,
    `reactionFrequency` INTEGER NOT NULL DEFAULT 20,
    `lastActiveAt` DATETIME(3) NULL,
    `totalPosts` INTEGER NOT NULL DEFAULT 0,
    `totalComments` INTEGER NOT NULL DEFAULT 0,
    `totalReactions` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ai_agent_userId_key`(`userId`),
    INDEX `ai_agent_status_idx`(`status`),
    INDEX `ai_agent_apiKeyId_idx`(`apiKeyId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_agent_memory` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `type` ENUM('INTERACTION', 'PREFERENCE', 'CONTEXT', 'FEEDBACK') NOT NULL,
    `content` TEXT NOT NULL,
    `importance` INTEGER NOT NULL DEFAULT 5,
    `expiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_agent_memory_agentId_type_idx`(`agentId`, `type`),
    INDEX `ai_agent_memory_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ai_activity_log` (
    `id` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `actionType` ENUM('POST', 'COMMENT', 'REPLY', 'REACTION', 'SHARE') NOT NULL,
    `targetId` VARCHAR(191) NULL,
    `targetType` VARCHAR(191) NULL,
    `content` TEXT NULL,
    `tokensUsed` INTEGER NOT NULL DEFAULT 0,
    `filterResult` ENUM('PASSED', 'BLOCKED_PROFANITY', 'BLOCKED_DUPLICATE', 'BLOCKED_QUALITY', 'BLOCKED_SPAM') NOT NULL DEFAULT 'PASSED',
    `success` BOOLEAN NOT NULL DEFAULT true,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ai_activity_log_agentId_createdAt_idx`(`agentId`, `createdAt`),
    INDEX `ai_activity_log_actionType_idx`(`actionType`),
    INDEX `ai_activity_log_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `content_hash` (
    `id` VARCHAR(191) NOT NULL,
    `hash` VARCHAR(191) NOT NULL,
    `agentId` VARCHAR(191) NOT NULL,
    `contentType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `content_hash_hash_key`(`hash`),
    INDEX `content_hash_agentId_idx`(`agentId`),
    INDEX `content_hash_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service_category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_category_slug_key`(`slug`),
    INDEX `service_category_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `service` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `icon` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `categoryId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `service_slug_key`(`slug`),
    INDEX `service_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    INDEX `service_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_tier` (
    `id` VARCHAR(191) NOT NULL,
    `serviceId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `price` DECIMAL(15, 0) NOT NULL,
    `priceNote` VARCHAR(191) NULL,
    `currency` VARCHAR(191) NOT NULL DEFAULT 'VND',
    `billingType` VARCHAR(191) NOT NULL DEFAULT 'one-time',
    `features` LONGTEXT NOT NULL,
    `isPopular` BOOLEAN NOT NULL DEFAULT false,
    `isRecommended` BOOLEAN NOT NULL DEFAULT false,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `ctaText` VARCHAR(191) NOT NULL DEFAULT 'Liên hệ tư vấn',
    `ctaLink` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pricing_tier_serviceId_isActive_displayOrder_idx`(`serviceId`, `isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pricing_faq` (
    `id` VARCHAR(191) NOT NULL,
    `question` VARCHAR(191) NOT NULL,
    `answer` TEXT NOT NULL,
    `category` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `pricing_faq_isActive_displayOrder_idx`(`isActive`, `displayOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quote_request` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `company` VARCHAR(191) NULL,
    `serviceId` VARCHAR(191) NULL,
    `tierId` VARCHAR(191) NULL,
    `budget` VARCHAR(191) NULL,
    `timeline` VARCHAR(191) NULL,
    `requirements` TEXT NULL,
    `source` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'CONTACTED', 'QUOTED', 'NEGOTIATING', 'ACCEPTED', 'REJECTED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `quote_request_status_createdAt_idx`(`status`, `createdAt`),
    INDEX `quote_request_email_idx`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ad` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `ctaText` VARCHAR(191) NOT NULL DEFAULT 'Tìm hiểu thêm',
    `ctaLink` VARCHAR(191) NOT NULL,
    `placement` ENUM('FEED', 'SIDEBAR', 'BOTH') NOT NULL DEFAULT 'FEED',
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `priority` INTEGER NOT NULL DEFAULT 0,
    `clickCount` INTEGER NOT NULL DEFAULT 0,
    `impressionCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ad_isActive_placement_idx`(`isActive`, `placement`),
    INDEX `ad_priority_idx`(`priority`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ad_clicks` (
    `id` VARCHAR(191) NOT NULL,
    `adId` VARCHAR(191) NOT NULL,
    `ipHash` VARCHAR(191) NULL,
    `userAgent` TEXT NULL,
    `clickedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ad_clicks_adId_clickedAt_idx`(`adId`, `clickedAt`),
    INDEX `ad_clicks_adId_ipHash_clickedAt_idx`(`adId`, `ipHash`, `clickedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_setting` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `category` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_setting_key_key`(`key`),
    INDEX `system_setting_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_post` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `excerpt` TEXT NULL,
    `content` TEXT NOT NULL,
    `featuredImage` VARCHAR(191) NULL,
    `categoryId` VARCHAR(191) NOT NULL,
    `authorId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `postType` ENUM('ARTICLE', 'TUTORIAL', 'COMPARISON', 'FAQ') NOT NULL DEFAULT 'ARTICLE',
    `tags` LONGTEXT NULL,
    `publishedAt` DATETIME(3) NULL,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `readingTime` INTEGER NOT NULL DEFAULT 0,
    `tableOfContents` JSON NULL,
    `takeaways` JSON NULL,
    `metaTitle` VARCHAR(191) NULL,
    `metaDescription` TEXT NULL,
    `sourcePostId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_post_slug_key`(`slug`),
    UNIQUE INDEX `blog_post_sourcePostId_key`(`sourcePostId`),
    INDEX `blog_post_status_publishedAt_idx`(`status`, `publishedAt`),
    INDEX `blog_post_categoryId_idx`(`categoryId`),
    INDEX `blog_post_authorId_idx`(`authorId`),
    INDEX `blog_post_slug_idx`(`slug`),
    INDEX `BlogPost_status_updatedAt_idx`(`status`, `updatedAt`),
    FULLTEXT INDEX `BlogPost_search_idx`(`title`, `content`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `blog_category` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `parentId` VARCHAR(191) NULL,
    `displayOrder` INTEGER NOT NULL DEFAULT 0,
    `postCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `blog_category_slug_key`(`slug`),
    INDEX `blog_category_slug_idx`(`slug`),
    INDEX `blog_category_parentId_idx`(`parentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `media` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `hash` VARCHAR(191) NULL,
    `originalSize` INTEGER NULL,
    `compressionRatio` DOUBLE NULL,
    `type` ENUM('AVATAR', 'COVER', 'POST_IMAGE', 'BLOG_IMAGE', 'AD_IMAGE') NOT NULL,
    `status` ENUM('PROCESSING', 'READY', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
    `storagePath` VARCHAR(191) NOT NULL,
    `publicUrl` VARCHAR(191) NOT NULL,
    `originalPath` VARCHAR(191) NULL,
    `originalUrl` VARCHAR(191) NULL,
    `originalMimeType` VARCHAR(191) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `variants` JSON NULL,
    `errorMessage` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `media_userId_idx`(`userId`),
    INDEX `media_type_idx`(`type`),
    INDEX `media_status_idx`(`status`),
    INDEX `media_createdAt_idx`(`createdAt`),
    INDEX `media_hash_idx`(`hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `Comment_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `Comment_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `comment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment` ADD CONSTRAINT `Comment_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follow` ADD CONSTRAINT `Follow_followerId_fkey` FOREIGN KEY (`followerId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `follow` ADD CONSTRAINT `Follow_followingId_fkey` FOREIGN KEY (`followingId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `like` ADD CONSTRAINT `Like_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `like` ADD CONSTRAINT `Like_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `like` ADD CONSTRAINT `Like_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post` ADD CONSTRAINT `Post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post` ADD CONSTRAINT `Post_sharedPostId_fkey` FOREIGN KEY (`sharedPostId`) REFERENCES `post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posthashtag` ADD CONSTRAINT `PostHashtag_hashtagId_fkey` FOREIGN KEY (`hashtagId`) REFERENCES `hashtag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posthashtag` ADD CONSTRAINT `PostHashtag_postId_fkey` FOREIGN KEY (`postId`) REFERENCES `post`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `profile` ADD CONSTRAINT `Profile_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reputationtransaction` ADD CONSTRAINT `ReputationTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_settings` ADD CONSTRAINT `UserSettings_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendrequest` ADD CONSTRAINT `friendrequest_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `friendrequest` ADD CONSTRAINT `friendrequest_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_agent` ADD CONSTRAINT `ai_agent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_agent` ADD CONSTRAINT `ai_agent_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `ai_provider_key`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_agent_memory` ADD CONSTRAINT `ai_agent_memory_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `ai_agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ai_activity_log` ADD CONSTRAINT `ai_activity_log_agentId_fkey` FOREIGN KEY (`agentId`) REFERENCES `ai_agent`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service` ADD CONSTRAINT `service_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `service_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pricing_tier` ADD CONSTRAINT `pricing_tier_serviceId_fkey` FOREIGN KEY (`serviceId`) REFERENCES `service`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ad_clicks` ADD CONSTRAINT `ad_clicks_adId_fkey` FOREIGN KEY (`adId`) REFERENCES `ad`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post` ADD CONSTRAINT `blog_post_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `blog_category`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post` ADD CONSTRAINT `blog_post_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_post` ADD CONSTRAINT `blog_post_sourcePostId_fkey` FOREIGN KEY (`sourcePostId`) REFERENCES `post`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `blog_category` ADD CONSTRAINT `blog_category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `blog_category`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `media` ADD CONSTRAINT `media_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
