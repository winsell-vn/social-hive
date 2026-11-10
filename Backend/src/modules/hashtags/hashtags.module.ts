import { Module, forwardRef } from "@nestjs/common";
import { HashtagsController } from "./controllers/hashtags.controller";
import { HashtagsService } from "./services/hashtags.service";
import { HashtagsRepository } from "./repositories/hashtags.repository";
import { PostsModule } from "../posts/posts.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule, forwardRef(() => PostsModule)],
  controllers: [HashtagsController],
  providers: [HashtagsService, HashtagsRepository],
  exports: [HashtagsService, HashtagsRepository],
})
export class HashtagsModule {}
