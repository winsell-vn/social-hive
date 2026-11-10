import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bull";
import { UploadController } from "./controllers/upload.controller";
import { ImageServeController } from "./controllers/image-serve.controller";
import { UploadService } from "./services/upload.service";
import { LocalStorageAdapter } from "./adapters/local-storage.adapter";
import { MediaRepository } from "./repositories/media.repository";
import { STORAGE_ADAPTER } from "./interfaces/storage.interface";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";
import { ImageProcessorService } from "./services/image-processor.service";
import { ImageCacheService } from "./services/image-cache.service";
import { ImageProcessingProcessor } from "./processors/image-processing.processor";
import { OrphanedMediaCleanupJob } from "./jobs/orphaned-media-cleanup.job";

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    RedisModule,
    BullModule.registerQueue({ name: "image-processing" }),
  ],
  controllers: [UploadController, ImageServeController],
  providers: [
    UploadService,
    { provide: STORAGE_ADAPTER, useClass: LocalStorageAdapter },
    MediaRepository,
    ImageProcessorService,
    ImageCacheService,
    ImageProcessingProcessor,
    OrphanedMediaCleanupJob,
  ],
  exports: [
    UploadService,
    MediaRepository,
    STORAGE_ADAPTER,
    ImageProcessorService,
    ImageCacheService,
  ],
})
export class UploadModule {}
