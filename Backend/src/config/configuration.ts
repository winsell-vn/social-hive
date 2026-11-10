export default () => ({
  app: {
    nodeEnv: process.env.NODE_ENV || "development",
    port: parseInt(process.env.PORT || "4000", 10),
    frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    cookieSameSite: process.env.COOKIE_SAME_SITE || "lax",
    cookieDomain: process.env.COOKIE_DOMAIN || undefined, // e.g., ".chungtoixayweb.vn" for cross-subdomain
  },
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  session: {
    defaultExpiryMs: 24 * 60 * 60 * 1000, // 24 hours in ms
    rememberMeExpiryMs: 30 * 24 * 60 * 60 * 1000, // 30 days in ms
    absoluteMaxExpiryMs: 30 * 24 * 60 * 60 * 1000, // 30 days max
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    password: process.env.REDIS_PASSWORD,
  },
  mail: {
    resendApiKey: process.env.RESEND_API_KEY || "",
    from: process.env.MAIL_FROM || "noreply@chungtoixayweb.vn",
  },
  newsfeed: {
    // Maximum ratio of AI posts in newsfeed (0.0 to 1.0, default 0.25 = 25%)
    maxAiPostRatio: parseFloat(process.env.NEWSFEED_MAX_AI_RATIO || "0.25"),
  },
  chatbot: {
    aiProviderKey:
      process.env.CHATBOT_GROQ_API_KEY || process.env.AI_GROQ_API_KEY || "",
    baseUrl: process.env.CHATBOT_BASE_URL || "https://api.groq.com/openai/v1",
    protocol: process.env.CHATBOT_PROTOCOL || "OPENAI_CHAT_COMPLETION",
    primaryModel:
      process.env.CHATBOT_PRIMARY_MODEL || "llama-3.3-70b-versatile",
    fallbackModel: process.env.CHATBOT_FALLBACK_MODEL || "llama-3.1-8b-instant",
    maxTokens: parseInt(process.env.CHATBOT_MAX_TOKENS || "512", 10),
    temperature: parseFloat(process.env.CHATBOT_TEMPERATURE || "0.7"),
  },
  turnstile: {
    secretKey: process.env.TURNSTILE_SECRET_KEY || "",
  },
  upload: {
    storagePath: process.env.UPLOAD_STORAGE_PATH || "./uploads",
    maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE || "10485760", 10), // 10MB
    maxFilesPerUpload: parseInt(
      process.env.UPLOAD_MAX_FILES_PER_UPLOAD || "5",
      10,
    ),
    dailyQuota: parseInt(process.env.UPLOAD_DAILY_QUOTA || "52428800", 10), // 50MB
    rateLimitPerHour: parseInt(
      process.env.UPLOAD_RATE_LIMIT_PER_HOUR || "10",
      10,
    ),
    webpQuality: parseInt(process.env.UPLOAD_WEBP_QUALITY || "80", 10),
    maxDimension: parseInt(process.env.UPLOAD_MAX_DIMENSION || "4096", 10),
    allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    variants: {
      thumbnail: { width: 150, height: 150 },
      small: { width: 320, height: 320 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 },
    },
    cache: {
      lruMaxSize: parseInt(
        process.env.UPLOAD_CACHE_LRU_MAX_SIZE || String(100 * 1024 * 1024),
        10,
      ), // 100MB
      lruTtl: parseInt(
        process.env.UPLOAD_CACHE_LRU_TTL || String(60 * 60 * 1000),
        10,
      ), // 1 hour
      metadataTtl: parseInt(
        process.env.UPLOAD_CACHE_METADATA_TTL || "86400",
        10,
      ), // 24 hours
    },
  },
});
