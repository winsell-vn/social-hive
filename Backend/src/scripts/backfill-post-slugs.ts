/**
 * Backfill script to generate slugs for existing posts that don't have one.
 *
 * Usage: npx ts-node -r tsconfig-paths/register src/scripts/backfill-post-slugs.ts
 *
 * Or add to package.json scripts:
 *   "backfill:slugs": "ts-node -r tsconfig-paths/register src/scripts/backfill-post-slugs.ts"
 */

import { PrismaClient } from '@prisma/client';
import { generateSlug, generateUniqueSlug } from '../common/utils/slug.util';

const prisma = new PrismaClient();

async function backfillPostSlugs() {
  console.log('Starting slug backfill...');

  const postsWithoutSlugs = await prisma.post.findMany({
    where: { slug: null },
    select: { id: true, authorId: true, content: true },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${postsWithoutSlugs.length} posts without slugs`);

  let updated = 0;
  let failed = 0;

  for (const post of postsWithoutSlugs) {
    try {
      const baseSlug = generateSlug(post.content);

      if (!baseSlug) {
        console.warn(`Post ${post.id}: Empty slug generated, using fallback`);
        const fallbackSlug = `post-${post.id.substring(0, 8)}`;
        await prisma.post.update({
          where: { id: post.id },
          data: { slug: fallbackSlug },
        });
        updated++;
        continue;
      }

      const slug = await generateUniqueSlug(baseSlug, async (s) => {
        const existing = await prisma.post.findFirst({
          where: { authorId: post.authorId, slug: s },
          select: { id: true },
        });
        return !!existing;
      });

      await prisma.post.update({
        where: { id: post.id },
        data: { slug },
      });

      updated++;

      if (updated % 100 === 0) {
        console.log(`Progress: ${updated}/${postsWithoutSlugs.length} posts updated`);
      }
    } catch (error) {
      failed++;
      console.error(`Failed to update post ${post.id}:`, error);
    }
  }

  console.log(`\nBackfill complete:`);
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${postsWithoutSlugs.length}`);
}

backfillPostSlugs()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

