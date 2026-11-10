import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { PostStatus, BlogPostStatus } from "@prisma/client";
import { RedisService } from "../../../redis/redis.service";
import {
  SITEMAP_CACHE_KEYS,
  SITEMAP_CACHE_TTL,
  SITEMAP_COUNT_CACHE_TTL,
} from "../../../redis/cache-keys";

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never";
  priority?: number;
}

interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}

@Injectable()
export class SitemapService {
  private readonly logger = new Logger(SitemapService.name);
  private readonly baseUrl: string;
  // Max URLs per sitemap file (spec allows 50,000, using 5,000 for performance)
  private readonly SITEMAP_MAX_URLS = 5000;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private redisService: RedisService,
  ) {
    this.baseUrl =
      this.configService.get<string>("FRONTEND_URL") ||
      "https://chungtoixayweb.vn";
  }

  /**
   * Generate the main sitemap index that lists all sub-sitemaps.
   * Dynamically calculates pagination based on entity counts.
   */
  async generateSitemapIndex(): Promise<string> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.INDEX(),
      async () => {
        this.logger.log("Generating sitemap index");

        const sitemaps: SitemapIndexEntry[] = [];

        // Get counts for paginated sitemaps
        const [postsCount, usersCount, hashtagsCount, blogCount, imagesCount] =
          await Promise.all([
            this.getPostsCount(),
            this.getUsersCount(),
            this.getHashtagsCount(),
            this.getBlogCount(),
            this.getImagesCount(),
          ]);

        // Add paginated posts sitemaps
        const postsPages = Math.max(
          1,
          Math.ceil(postsCount / this.SITEMAP_MAX_URLS),
        );
        for (let i = 1; i <= postsPages; i++) {
          sitemaps.push({ loc: `${this.baseUrl}/sitemap/posts-${i}.xml` });
        }

        // Add paginated users sitemaps
        const usersPages = Math.max(
          1,
          Math.ceil(usersCount / this.SITEMAP_MAX_URLS),
        );
        for (let i = 1; i <= usersPages; i++) {
          sitemaps.push({ loc: `${this.baseUrl}/sitemap/users-${i}.xml` });
        }

        // Add paginated hashtags sitemaps
        const hashtagsPages = Math.max(
          1,
          Math.ceil(hashtagsCount / this.SITEMAP_MAX_URLS),
        );
        for (let i = 1; i <= hashtagsPages; i++) {
          sitemaps.push({ loc: `${this.baseUrl}/sitemap/hashtags-${i}.xml` });
        }

        // Static sitemap (always single page)
        sitemaps.push({ loc: `${this.baseUrl}/sitemap/static.xml` });

        // Add paginated blog sitemaps
        const blogPages = Math.max(
          1,
          Math.ceil(blogCount / this.SITEMAP_MAX_URLS),
        );
        for (let i = 1; i <= blogPages; i++) {
          sitemaps.push({ loc: `${this.baseUrl}/sitemap/blog-${i}.xml` });
        }

        // Add paginated images sitemaps
        const imagesPages = Math.max(
          1,
          Math.ceil(imagesCount / this.SITEMAP_MAX_URLS),
        );
        for (let i = 1; i <= imagesPages; i++) {
          sitemaps.push({ loc: `${this.baseUrl}/sitemap/images-${i}.xml` });
        }

        return this.buildSitemapIndex(sitemaps);
      },
      SITEMAP_CACHE_TTL,
    );
  }

  // Count methods with caching
  private async getPostsCount(): Promise<number> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.COUNT_POSTS(),
      async () => {
        return this.prisma.post.count({
          where: {
            status: PostStatus.PUBLISHED,
            author: { profile: { isNot: null } },
          },
        });
      },
      SITEMAP_COUNT_CACHE_TTL,
    );
  }

  private async getUsersCount(): Promise<number> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.COUNT_USERS(),
      async () => {
        return this.prisma.profile.count({
          where: { isPrivate: false },
        });
      },
      SITEMAP_COUNT_CACHE_TTL,
    );
  }

  private async getHashtagsCount(): Promise<number> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.COUNT_HASHTAGS(),
      async () => {
        return this.prisma.hashtag.count({
          where: { postCount: { gt: 0 } },
        });
      },
      SITEMAP_COUNT_CACHE_TTL,
    );
  }

  private async getBlogCount(): Promise<number> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.COUNT_BLOG(),
      async () => {
        return this.prisma.blogPost.count({
          where: { status: BlogPostStatus.PUBLISHED },
        });
      },
      SITEMAP_COUNT_CACHE_TTL,
    );
  }

  private async getImagesCount(): Promise<number> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.COUNT_IMAGES(),
      async () => {
        // Count posts with images + profiles with avatars + blog posts with featured images
        const [postsWithImages, profilesWithAvatars, blogWithImages] =
          await Promise.all([
            this.prisma.post.count({
              where: {
                status: PostStatus.PUBLISHED,
                images: { not: null },
                author: { profile: { isNot: null } },
              },
            }),
            this.prisma.profile.count({
              where: { isPrivate: false, avatar: { not: null } },
            }),
            this.prisma.blogPost.count({
              where: {
                status: BlogPostStatus.PUBLISHED,
                featuredImage: { not: null },
              },
            }),
          ]);
        return postsWithImages + profilesWithAvatars + blogWithImages;
      },
      SITEMAP_COUNT_CACHE_TTL,
    );
  }

  async generateStaticPagesSitemap(): Promise<string> {
    this.logger.log("Generating static pages sitemap");

    const staticPages: SitemapUrl[] = [
      {
        loc: this.baseUrl,
        changefreq: "daily",
        priority: 1.0,
      },
      {
        loc: `${this.baseUrl}/trending`,
        changefreq: "daily",
        priority: 0.8,
      },
      {
        loc: `${this.baseUrl}/bang-gia`,
        changefreq: "weekly",
        priority: 0.9,
      },
      {
        loc: `${this.baseUrl}/about`,
        changefreq: "monthly",
        priority: 0.7,
      },
      {
        loc: `${this.baseUrl}/contact`,
        changefreq: "monthly",
        priority: 0.6,
      },
      {
        loc: `${this.baseUrl}/blog`,
        changefreq: "daily",
        priority: 0.8,
      },
      {
        loc: `${this.baseUrl}/privacy`,
        changefreq: "yearly",
        priority: 0.3,
      },
      {
        loc: `${this.baseUrl}/terms`,
        changefreq: "yearly",
        priority: 0.3,
      },
      // Topic cluster pages
      {
        loc: `${this.baseUrl}/topics/web-design`,
        changefreq: "weekly",
        priority: 0.7,
      },
      {
        loc: `${this.baseUrl}/topics/mobile-app`,
        changefreq: "weekly",
        priority: 0.7,
      },
      {
        loc: `${this.baseUrl}/topics/zalo-mini-app`,
        changefreq: "weekly",
        priority: 0.7,
      },
      {
        loc: `${this.baseUrl}/topics/seo`,
        changefreq: "weekly",
        priority: 0.7,
      },
      {
        loc: `${this.baseUrl}/topics/ui-ux`,
        changefreq: "weekly",
        priority: 0.7,
      },
      {
        loc: `${this.baseUrl}/topics/e-commerce`,
        changefreq: "weekly",
        priority: 0.7,
      },
    ];

    return this.buildUrlset(staticPages);
  }

  async generatePostsSitemap(page: number = 1): Promise<string> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.POSTS(page),
      async () => {
        this.logger.log(`Generating posts sitemap page ${page}`);
        const skip = (page - 1) * this.SITEMAP_MAX_URLS;

        const posts = await this.prisma.post.findMany({
          where: {
            status: PostStatus.PUBLISHED,
            author: {
              profile: { isNot: null },
            },
          },
          select: {
            id: true,
            slug: true,
            updatedAt: true,
            author: {
              select: {
                profile: {
                  select: { username: true },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: this.SITEMAP_MAX_URLS,
        });

        // Return minimal sitemap with homepage if no posts exist
        if (posts.length === 0) {
          return this.buildUrlset([
            {
              loc: this.baseUrl,
              changefreq: "daily",
              priority: 1.0,
            },
          ]);
        }

        const urls: SitemapUrl[] = posts
          .filter((post) => post.author.profile?.username)
          .map((post) => ({
            loc: `${this.baseUrl}/profile/${post.author.profile!.username}/${post.slug || post.id}`,
            lastmod: post.updatedAt.toISOString(),
            changefreq: "weekly",
            priority: 0.8,
          }));

        return this.buildUrlset(urls);
      },
      SITEMAP_CACHE_TTL,
    );
  }

  async generateUsersSitemap(page: number = 1): Promise<string> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.USERS(page),
      async () => {
        this.logger.log(`Generating users sitemap page ${page}`);
        const skip = (page - 1) * this.SITEMAP_MAX_URLS;

        const profiles = await this.prisma.profile.findMany({
          where: {
            isPrivate: false,
          },
          select: {
            username: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: this.SITEMAP_MAX_URLS,
        });

        // Return minimal sitemap with homepage if no profiles exist
        if (profiles.length === 0) {
          return this.buildUrlset([
            {
              loc: this.baseUrl,
              changefreq: "daily",
              priority: 1.0,
            },
          ]);
        }

        const urls: SitemapUrl[] = profiles.map((profile) => ({
          loc: `${this.baseUrl}/profile/${profile.username}`,
          lastmod: profile.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.7,
        }));

        return this.buildUrlset(urls);
      },
      SITEMAP_CACHE_TTL,
    );
  }

  async generateHashtagsSitemap(page: number = 1): Promise<string> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.HASHTAGS(page),
      async () => {
        this.logger.log(`Generating hashtags sitemap page ${page}`);
        const skip = (page - 1) * this.SITEMAP_MAX_URLS;

        const hashtags = await this.prisma.hashtag.findMany({
          where: {
            postCount: { gt: 0 },
          },
          select: {
            name: true,
            createdAt: true,
            posts: {
              select: {
                post: {
                  select: {
                    updatedAt: true,
                  },
                },
              },
              orderBy: {
                post: {
                  updatedAt: "desc",
                },
              },
              take: 1,
            },
          },
          orderBy: { postCount: "desc" },
          skip,
          take: this.SITEMAP_MAX_URLS,
        });

        // Return minimal sitemap with homepage if no hashtags exist
        if (hashtags.length === 0) {
          return this.buildUrlset([
            {
              loc: this.baseUrl,
              changefreq: "daily",
              priority: 1.0,
            },
          ]);
        }

        const urls: SitemapUrl[] = hashtags.map((hashtag) => {
          const latestPostDate = hashtag.posts[0]?.post?.updatedAt;
          const lastmod = latestPostDate
            ? latestPostDate.toISOString()
            : hashtag.createdAt.toISOString();

          return {
            loc: `${this.baseUrl}/hashtag/${hashtag.name}`,
            lastmod,
            changefreq: "daily" as const,
            priority: 0.6,
          };
        });

        return this.buildUrlset(urls);
      },
      SITEMAP_CACHE_TTL,
    );
  }

  async generateBlogSitemap(page: number = 1): Promise<string> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.BLOG(page),
      async () => {
        this.logger.log(`Generating blog sitemap page ${page}`);
        const skip = (page - 1) * this.SITEMAP_MAX_URLS;

        const blogPosts = await this.prisma.blogPost.findMany({
          where: {
            status: BlogPostStatus.PUBLISHED,
          },
          select: {
            slug: true,
            updatedAt: true,
            category: {
              select: { slug: true },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip,
          take: this.SITEMAP_MAX_URLS,
        });

        // Return minimal sitemap with homepage if no blog posts exist
        if (blogPosts.length === 0) {
          return this.buildUrlset([
            {
              loc: this.baseUrl,
              changefreq: "daily",
              priority: 1.0,
            },
          ]);
        }

        const urls: SitemapUrl[] = blogPosts.map((post) => ({
          loc: `${this.baseUrl}/blog/${post.category.slug}/${post.slug}`,
          lastmod: post.updatedAt.toISOString(),
          changefreq: "weekly",
          priority: 0.8,
        }));

        return this.buildUrlset(urls);
      },
      SITEMAP_CACHE_TTL,
    );
  }

  async generateImageSitemap(page: number = 1): Promise<string> {
    return this.redisService.getOrSet(
      SITEMAP_CACHE_KEYS.IMAGES(page),
      async () => {
        this.logger.log(`Generating image sitemap page ${page}`);
        const skip = (page - 1) * this.SITEMAP_MAX_URLS;

        // For image sitemap, we need to handle pagination across multiple sources
        // We'll fetch from each source with appropriate skip/take
        const perSourceLimit = Math.ceil(this.SITEMAP_MAX_URLS / 3);
        const sourceSkip = Math.floor(skip / 3);

        // Fetch post images
        const posts = await this.prisma.post.findMany({
          where: {
            status: PostStatus.PUBLISHED,
            images: { not: null },
            author: {
              profile: { isNot: null },
            },
          },
          select: {
            id: true,
            slug: true,
            images: true,
            content: true,
            updatedAt: true,
            author: {
              select: {
                profile: {
                  select: { username: true },
                },
              },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip: sourceSkip,
          take: perSourceLimit,
        });

        // Fetch user avatars
        const profiles = await this.prisma.profile.findMany({
          where: {
            isPrivate: false,
            avatar: { not: null },
          },
          select: {
            username: true,
            avatar: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: "desc" },
          skip: sourceSkip,
          take: perSourceLimit,
        });

        // Fetch blog post images
        const blogPosts = await this.prisma.blogPost.findMany({
          where: {
            status: BlogPostStatus.PUBLISHED,
            featuredImage: { not: null },
          },
          select: {
            slug: true,
            featuredImage: true,
            title: true,
            updatedAt: true,
            category: {
              select: { slug: true },
            },
          },
          orderBy: { updatedAt: "desc" },
          skip: sourceSkip,
          take: perSourceLimit,
        });

        const imageEntries: Array<{
          pageUrl: string;
          images: Array<{ url: string; caption?: string }>;
        }> = [];

        // Process post images
        for (const post of posts) {
          if (post.images && post.author.profile?.username) {
            try {
              const imageUrls = JSON.parse(post.images);
              if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                const pageUrl = `${this.baseUrl}/profile/${post.author.profile.username}/${post.slug || post.id}`;
                const images = imageUrls.map((url, index) => ({
                  url: this.toAbsoluteUrl(url),
                  caption: `Hình ${index + 1} trong bài viết`,
                }));
                imageEntries.push({ pageUrl, images });
              }
            } catch (error) {
              this.logger.warn(`Failed to parse images for post ${post.id}`);
            }
          }
        }

        // Process user avatars
        for (const profile of profiles) {
          if (profile.avatar) {
            const pageUrl = `${this.baseUrl}/profile/${profile.username}`;
            imageEntries.push({
              pageUrl,
              images: [
                {
                  url: this.toAbsoluteUrl(profile.avatar),
                  caption: `Ảnh đại diện của ${profile.username}`,
                },
              ],
            });
          }
        }

        // Process blog post images
        for (const post of blogPosts) {
          if (post.featuredImage) {
            const pageUrl = `${this.baseUrl}/blog/${post.category.slug}/${post.slug}`;
            imageEntries.push({
              pageUrl,
              images: [
                {
                  url: this.toAbsoluteUrl(post.featuredImage),
                  caption: post.title,
                },
              ],
            });
          }
        }

        // Return minimal sitemap with homepage if no images exist
        if (imageEntries.length === 0) {
          return this.buildImageSitemap([
            {
              pageUrl: this.baseUrl,
              images: [],
            },
          ]);
        }

        return this.buildImageSitemap(imageEntries);
      },
      SITEMAP_CACHE_TTL,
    );
  }

  private buildSitemapIndex(sitemaps: SitemapIndexEntry[]): string {
    const entries = sitemaps
      .map((sitemap) => {
        let entry = `  <sitemap>\n    <loc>${this.escapeXml(sitemap.loc)}</loc>`;
        if (sitemap.lastmod) {
          entry += `\n    <lastmod>${sitemap.lastmod}</lastmod>`;
        }
        entry += "\n  </sitemap>";
        return entry;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;
  }

  private buildUrlset(urls: SitemapUrl[]): string {
    const entries = urls
      .map((url) => {
        let entry = `  <url>\n    <loc>${this.escapeXml(url.loc)}</loc>`;
        if (url.lastmod) entry += `\n    <lastmod>${url.lastmod}</lastmod>`;
        if (url.changefreq)
          entry += `\n    <changefreq>${url.changefreq}</changefreq>`;
        if (url.priority !== undefined)
          entry += `\n    <priority>${url.priority}</priority>`;
        entry += "\n  </url>";
        return entry;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
  }

  private buildImageSitemap(
    entries: Array<{
      pageUrl: string;
      images: Array<{ url: string; caption?: string }>;
    }>,
  ): string {
    const urlEntries = entries
      .map((entry) => {
        const imageElements = entry.images
          .map(
            (img) =>
              `    <image:image>\n      <image:loc>${this.escapeXml(img.url)}</image:loc>${img.caption ? `\n      <image:caption>${this.escapeXml(img.caption)}</image:caption>` : ""}\n    </image:image>`,
          )
          .join("\n");

        return `  <url>\n    <loc>${this.escapeXml(entry.pageUrl)}</loc>\n${imageElements}\n  </url>`;
      })
      .join("\n");

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlEntries}
</urlset>`;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }

  /**
   * Convert a potentially relative URL to an absolute URL.
   * If the URL is already absolute (starts with http:// or https://), return as-is.
   * If relative (starts with /), prepend the base URL.
   */
  private toAbsoluteUrl(url: string): string {
    if (!url) return url;
    // Already absolute URL
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Relative URL - prepend base URL
    if (url.startsWith("/")) {
      return `${this.baseUrl}${url}`;
    }
    // No leading slash - add one
    return `${this.baseUrl}/${url}`;
  }
}
