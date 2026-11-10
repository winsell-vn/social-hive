import { Module, forwardRef } from "@nestjs/common";
import { PostsController } from "./controllers/posts.controller";
import { PostsService } from "./services/posts.service";
import { RelatedPostsService } from "./services/related-posts.service";
import { PostsRepository } from "./repositories/posts.repository";
import { HashtagsModule } from "../hashtags/hashtags.module";
import { ProfilesModule } from "../profiles/profiles.module";
import { BlogModule } from "../blog/blog.module";
import { UploadModule } from "../upload/upload.module";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [
    forwardRef(() => HashtagsModule),
    forwardRef(() => ProfilesModule),
    BlogModule,
    UploadModule,
    PrismaModule,
  ],
  controllers: [PostsController],
  providers: [PostsService, RelatedPostsService, PostsRepository],
  exports: [PostsService, PostsRepository],
})
export class PostsModule {}
