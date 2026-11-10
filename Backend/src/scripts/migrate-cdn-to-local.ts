import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";
import https from "https";

const prisma = new PrismaClient();
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
const CDN_BASE = "https://cdn.chungtoixayweb.vn";

/**
 * Download a file from URL to local path
 */
async function downloadFile(url: string, destPath: string): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(destPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const file = fs.createWriteStream(destPath);
      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            console.error(
              `Failed to download ${url}: HTTP ${response.statusCode}`,
            );
            file.close();
            fs.unlinkSync(destPath);
            resolve(false);
            return;
          }

          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log(`Downloaded: ${url} -> ${destPath}`);
            resolve(true);
          });
        })
        .on("error", (err) => {
          fs.unlinkSync(destPath);
          console.error(`Error downloading ${url}:`, err.message);
          resolve(false);
        });
    } catch (error) {
      console.error(`Error downloading ${url}:`, error);
      resolve(false);
    }
  });
}

/**
 * Convert CDN URL to local path
 */
function cdnUrlToLocalPath(cdnUrl: string): string | null {
  if (!cdnUrl || !cdnUrl.includes("cdn.chungtoixayweb.vn")) return null;

  try {
    const urlObj = new URL(cdnUrl);
    const cdnPath = urlObj.pathname; // e.g., /avatars/file.webp
    return path.join(UPLOADS_DIR, cdnPath);
  } catch {
    return null;
  }
}

/**
 * Convert CDN URL to local relative path for database
 */
function cdnUrlToDbPath(cdnUrl: string): string | null {
  if (!cdnUrl || !cdnUrl.includes("cdn.chungtoixayweb.vn")) return null;

  try {
    const urlObj = new URL(cdnUrl);
    return `/uploads${urlObj.pathname}`; // e.g., /uploads/avatars/file.webp
  } catch {
    return null;
  }
}

/**
 * Migrate Profile avatars and cover photos
 */
async function migrateProfiles(): Promise<void> {
  console.log("\n=== Migrating Profiles ===");

  const profiles = await prisma.profile.findMany({
    where: {
      OR: [
        { avatar: { contains: "cdn.chungtoixayweb.vn" } },
        { coverPhoto: { contains: "cdn.chungtoixayweb.vn" } },
      ],
    },
  });

  console.log(`Found ${profiles.length} profiles with CDN URLs`);

  for (const profile of profiles) {
    const updates: { avatar?: string; coverPhoto?: string } = {};

    // Migrate avatar
    if (profile.avatar?.includes("cdn.chungtoixayweb.vn")) {
      const localPath = cdnUrlToLocalPath(profile.avatar);
      const dbPath = cdnUrlToDbPath(profile.avatar);

      if (localPath && dbPath) {
        const downloaded = await downloadFile(profile.avatar, localPath);
        if (downloaded) {
          updates.avatar = dbPath;
        }
      }
    }

    // Migrate cover photo
    if (profile.coverPhoto?.includes("cdn.chungtoixayweb.vn")) {
      const localPath = cdnUrlToLocalPath(profile.coverPhoto);
      const dbPath = cdnUrlToDbPath(profile.coverPhoto);

      if (localPath && dbPath) {
        const downloaded = await downloadFile(profile.coverPhoto, localPath);
        if (downloaded) {
          updates.coverPhoto = dbPath;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.profile.update({
        where: { id: profile.id },
        data: updates,
      });
      console.log(`Updated profile ${profile.id}`);
    }
  }
}

/**
 * Migrate BlogPost featured images
 */
async function migrateBlogPosts(): Promise<void> {
  console.log("\n=== Migrating Blog Posts ===");

  const posts = await prisma.blogPost.findMany({
    where: {
      featuredImage: { contains: "cdn.chungtoixayweb.vn" },
    },
  });

  console.log(`Found ${posts.length} blog posts with CDN URLs`);

  for (const post of posts) {
    if (post.featuredImage?.includes("cdn.chungtoixayweb.vn")) {
      const localPath = cdnUrlToLocalPath(post.featuredImage);
      const dbPath = cdnUrlToDbPath(post.featuredImage);

      if (localPath && dbPath) {
        const downloaded = await downloadFile(post.featuredImage, localPath);
        if (downloaded) {
          await prisma.blogPost.update({
            where: { id: post.id },
            data: { featuredImage: dbPath },
          });
          console.log(`Updated blog post ${post.id}`);
        }
      }
    }
  }
}

/**
 * Migrate Ad images
 */
async function migrateAds(): Promise<void> {
  console.log("\n=== Migrating Ads ===");

  const ads = await prisma.ad.findMany({
    where: {
      imageUrl: { contains: "cdn.chungtoixayweb.vn" },
    },
  });

  console.log(`Found ${ads.length} ads with CDN URLs`);

  for (const ad of ads) {
    if (ad.imageUrl?.includes("cdn.chungtoixayweb.vn")) {
      const localPath = cdnUrlToLocalPath(ad.imageUrl);
      const dbPath = cdnUrlToDbPath(ad.imageUrl);

      if (localPath && dbPath) {
        const downloaded = await downloadFile(ad.imageUrl, localPath);
        if (downloaded) {
          await prisma.ad.update({
            where: { id: ad.id },
            data: { imageUrl: dbPath },
          });
          console.log(`Updated ad ${ad.id}`);
        }
      }
    }
  }
}

/**
 * Migrate Media records
 */
async function migrateMedia(): Promise<void> {
  console.log("\n=== Migrating Media ===");

  const mediaRecords = await prisma.media.findMany({
    where: {
      OR: [
        { publicUrl: { contains: "cdn.chungtoixayweb.vn" } },
        { originalUrl: { contains: "cdn.chungtoixayweb.vn" } },
      ],
    },
  });

  console.log(`Found ${mediaRecords.length} media records with CDN URLs`);

  for (const media of mediaRecords) {
    const updates: { publicUrl?: string; originalUrl?: string } = {};

    // Migrate publicUrl
    if (media.publicUrl?.includes("cdn.chungtoixayweb.vn")) {
      const localPath = cdnUrlToLocalPath(media.publicUrl);
      const dbPath = cdnUrlToDbPath(media.publicUrl);

      if (localPath && dbPath) {
        const downloaded = await downloadFile(media.publicUrl, localPath);
        if (downloaded) {
          updates.publicUrl = dbPath;
        }
      }
    }

    // Migrate originalUrl
    if (media.originalUrl?.includes("cdn.chungtoixayweb.vn")) {
      const localPath = cdnUrlToLocalPath(media.originalUrl);
      const dbPath = cdnUrlToDbPath(media.originalUrl);

      if (localPath && dbPath) {
        const downloaded = await downloadFile(media.originalUrl, localPath);
        if (downloaded) {
          updates.originalUrl = dbPath;
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      await prisma.media.update({
        where: { id: media.id },
        data: updates,
      });
      console.log(`Updated media ${media.id}`);
    }
  }
}

/**
 * Migrate Post images (JSON array field)
 */
async function migratePostImages(): Promise<void> {
  console.log("\n=== Migrating Post Images ===");

  const posts = await prisma.post.findMany({
    where: {
      images: { contains: "cdn.chungtoixayweb.vn" },
    },
  });

  console.log(`Found ${posts.length} posts with CDN URLs in images`);

  for (const post of posts) {
    if (!post.images) continue;

    try {
      // Parse images JSON array
      const images: string[] = JSON.parse(post.images);
      const updatedImages: string[] = [];
      let hasChanges = false;

      for (const imageUrl of images) {
        if (imageUrl.includes("cdn.chungtoixayweb.vn")) {
          const localPath = cdnUrlToLocalPath(imageUrl);
          const dbPath = cdnUrlToDbPath(imageUrl);

          if (localPath && dbPath) {
            const downloaded = await downloadFile(imageUrl, localPath);
            if (downloaded) {
              updatedImages.push(dbPath);
              hasChanges = true;
              continue;
            }
          }
        }
        updatedImages.push(imageUrl);
      }

      if (hasChanges) {
        await prisma.post.update({
          where: { id: post.id },
          data: { images: JSON.stringify(updatedImages) },
        });
        console.log(`Updated post ${post.id}`);
      }
    } catch (error) {
      console.error(`Error parsing images for post ${post.id}:`, error);
    }
  }
}

/**
 * Main migration function
 */
async function main(): Promise<void> {
  console.log("Starting CDN to local migration...");
  console.log(`Uploads directory: ${UPLOADS_DIR}`);

  // Ensure uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  await migrateProfiles();
  await migrateBlogPosts();
  await migrateAds();
  await migrateMedia();
  await migratePostImages();

  console.log("\n=== Migration complete! ===");
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error("Migration failed:", error);
  prisma.$disconnect();
  process.exit(1);
});
