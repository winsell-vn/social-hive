import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ValidationPipe } from "@nestjs/common";
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import * as cookieParser from "cookie-parser";
import { join } from "path";
import { AppModule } from "./app.module";
import { winstonConfig } from "./common/logger/winston.config";
import { createHashPathFallbackMiddleware } from "./common/middleware/hash-path-fallback.middleware";
import { securityHeadersMiddleware } from "./common/middleware/security-headers.middleware";

// Enable BigInt JSON serialization (Prisma returns BigInt for count/aggregate fields)
// eslint-disable-next-line no-extend-native
(BigInt.prototype as unknown as { toJSON: () => number }).toJSON = function () {
  return Number(this);
};

// Create Winston logger instance for bootstrap logging
const winstonLogger = winston.createLogger(winstonConfig);
const logger = WinstonModule.createLogger({ instance: winstonLogger });

async function checkRedisConnection(): Promise<boolean> {
  const Redis = (await import("ioredis")).default;
  const host = process.env.REDIS_HOST || "localhost";
  const port = parseInt(process.env.REDIS_PORT || "6379", 10);
  const password = process.env.REDIS_PASSWORD || undefined;

  const client = new Redis({
    host,
    port,
    password,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
    lazyConnect: true,
  });

  try {
    await client.connect();
    const response = await client.ping();
    await client.quit();
    return response === "PONG";
  } catch (error) {
    try {
      await client.quit();
    } catch {
      // Ignore quit errors
    }
    return false;
  }
}

async function bootstrap() {
  // Step 1: Check if Redis is running (must be started manually)
  logger.log("Checking Redis connection...");
  const redisConnected = await checkRedisConnection();
  if (!redisConnected) {
    logger.error(
      "Redis is not running. Please ensure Redis is started before launching the backend.",
    );
    logger.error(
      `Failed to connect to Redis at ${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || "6379"}`,
    );
    process.exit(1);
  }
  logger.log("Redis connection validated successfully");

  // Step 2: Create NestJS application with Winston logger
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({ instance: winstonLogger }),
  });

  // Add cookie-parser middleware BEFORE CORS setup
  app.use(cookieParser());

  // Security headers (similar to helmet)
  app.use(securityHeadersMiddleware);

  // Hash-path fallback middleware - MUST run BEFORE static assets
  // This handles legacy flat paths (e.g., /uploads/avatars/file.webp) by redirecting
  // to hash-based paths (e.g., /uploads/avatars/ab/cd/file.webp)
  const uploadsPath = join(__dirname, "..", "uploads");
  app.use("/uploads", createHashPathFallbackMiddleware(uploadsPath));

  // Serve uploaded files statically
  // Note: __dirname at runtime is dist/, so we need '..' to reach Backend/uploads/
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads/",
  });

  // CORS: Support multiple origins from CORS_ORIGIN env var (comma-separated)
  const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : [process.env.FRONTEND_URL || "http://localhost:3000"];

  app.enableCors({
    origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.setGlobalPrefix("api");

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`Backend running on http://localhost:${port}`);
}
bootstrap();
