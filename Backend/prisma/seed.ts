import { PrismaClient, Role, Tier } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Resolve the password used for seeded admin accounts.
 *
 * Order of precedence:
 *  1. `SEED_ADMIN_PASSWORD` from the environment (recommended for production).
 *  2. A strong random password generated at runtime and printed once to the console.
 *
 * No default/hard-coded password is ever used, so running `npm run prisma:seed`
 * on a public checkout can never create an account with a known password.
 */
function resolveAdminPassword(): { password: string; isGenerated: boolean } {
  const fromEnv = process.env.SEED_ADMIN_PASSWORD?.trim();
  if (fromEnv) {
    if (fromEnv.length < 8) {
      throw new Error('SEED_ADMIN_PASSWORD must be at least 8 characters long.');
    }
    return { password: fromEnv, isGenerated: false };
  }

  // 24 bytes -> 32 hex chars, strong enough for an initial admin credential.
  const generated = crypto.randomBytes(24).toString('hex');
  return { password: generated, isGenerated: true };
}

// Service categories to seed (from Frontend/src/features/pricing/constants/categories.ts)
const serviceCategories = [
  {
    name: 'Website & Tên Miền',
    slug: 'website-ten-mien',
    icon: 'Globe',
    description: 'Thiết kế website, tên miền, hosting và SSL',
    displayOrder: 0,
    serviceSlugs: ['ten-mien', 'hosting-server', 'chung-chi-ssl', 'thiet-ke-website', 'tinh-nang-bo-sung'],
  },
  {
    name: 'Marketing Trực Tuyến',
    slug: 'marketing-truc-tuyen',
    icon: 'Megaphone',
    description: 'SEO, quảng cáo, content marketing và email',
    displayOrder: 1,
    serviceSlugs: ['seo', 'backlink-link-building', 'viet-bai-content-marketing', 'quang-cao-google-ads', 'quang-cao-facebook-ads', 'email-marketing', 'quan-ly-fanpage-mang-xa-hoi'],
  },
  {
    name: 'Ứng Dụng Di Động',
    slug: 'ung-dung-di-dong',
    icon: 'Smartphone',
    description: 'App Android, iOS và Zalo Mini App',
    displayOrder: 2,
    serviceSlugs: ['zalo-mini-app', 'ung-dung-mobile'],
  },
  {
    name: 'Phần Mềm & Hệ Thống',
    slug: 'phan-mem-he-thong',
    icon: 'Code',
    description: 'Web app, desktop app, CRM/ERP, API và DevOps',
    displayOrder: 3,
    serviceSlugs: ['ung-dung-desktop', 'phat-trien-web-application-saas', 'api-tich-hop-he-thong', 'devops-ha-tang-cloud', 'kiem-thu-dam-bao-chat-luong-qa', 'phan-mem-crm-erp-hrm', 'tu-van-thue-lap-trinh-vien'],
  },
  {
    name: 'Thiết Kế & Sáng Tạo',
    slug: 'thiet-ke-sang-tao',
    icon: 'Palette',
    description: 'Logo, nhận diện thương hiệu và UI/UX',
    displayOrder: 4,
    serviceSlugs: ['thiet-ke-logo-nhan-dien-thuong-hieu', 'thiet-ke-ui-ux'],
  },
  {
    name: 'AI & Tự Động Hóa',
    slug: 'ai-tu-dong-hoa',
    icon: 'Sparkles',
    description: 'Chatbot AI, machine learning, RPA và bảo trì',
    displayOrder: 5,
    serviceSlugs: ['chatbot-ai-bot', 'ai-machine-learning', 'tu-dong-hoa-rpa', 'bao-tri-ho-tro-ky-thuat'],
  },
  {
    name: 'Combo tiết kiệm',
    slug: 'combo-tiet-kiem-cat',
    icon: 'Package',
    description: 'Combo tiết kiệm khi mua nhiều dịch vụ cùng lúc - giảm 15-22% so với mua lẻ',
    displayOrder: 6,
    serviceSlugs: ['combo-tiet-kiem'],
  },
];

// Admin accounts to seed
const adminAccounts = [
  {
    email: 'superadmin@chungtoixayweb.vn',
    username: 'superadmin',
    displayName: 'Super Administrator',
    role: Role.SUPER_ADMIN,
    karma: 5000,
    tier: Tier.LEGEND,
    bio: 'Quản trị viên cấp cao của hệ thống',
  },
  {
    email: 'admin@chungtoixayweb.vn',
    username: 'admin',
    displayName: 'Administrator',
    role: Role.ADMIN,
    karma: 2000,
    tier: Tier.MASTER,
    bio: 'Quản trị viên hệ thống',
  },
  {
    email: 'admin2@chungtoixayweb.vn',
    username: 'admin2',
    displayName: 'Admin Backup',
    role: Role.ADMIN,
    karma: 1000,
    tier: Tier.EXPERT,
    bio: 'Quản trị viên dự phòng',
  },
];

async function seedAdminUsers() {
  console.log('🌱 Starting admin users seed...\n');

  const { password, isGenerated } = resolveAdminPassword();
  if (isGenerated) {
    console.log(
      '🔐 SEED_ADMIN_PASSWORD is not set - a random password was generated for this run.\n' +
        '   Set SEED_ADMIN_PASSWORD in your .env before seeding if you need a known password.\n',
    );
  }

  for (const account of adminAccounts) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: account.email },
    });

    if (existingUser) {
      console.log(`⏭️  User ${account.email} already exists, skipping...`);
      continue;
    }

    // Check if username already exists
    const existingProfile = await prisma.profile.findUnique({
      where: { username: account.username },
    });

    if (existingProfile) {
      console.log(`⏭️  Username ${account.username} already exists, skipping...`);
      continue;
    }

    // Hash password with bcrypt cost factor 12 (same as auth.service.ts)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with transaction to ensure data consistency
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: account.email,
          password: hashedPassword,
          role: account.role,
          karma: account.karma,
          tier: account.tier,
          isActive: true, // Admin accounts are active by default
          lastActiveAt: new Date(),
        },
      });

      // Create profile
      await tx.profile.create({
        data: {
          userId: newUser.id,
          username: account.username,
          displayName: account.displayName,
          bio: account.bio,
          isPrivate: false,
          followerCount: 0,
          followingCount: 0,
        },
      });

      // Create user settings with default values
      await tx.userSettings.create({
        data: {
          userId: newUser.id,
        },
      });

      return newUser;
    });

    console.log(`✅ Created ${account.role}: ${account.email} (ID: ${user.id})`);
  }

  console.log('\n📊 Admin accounts summary:');
  console.log('┌─────────────────────────────────────────────────────────────────┐');
  console.log('│ Role         │ Email                          │ Status         │');
  console.log('├─────────────────────────────────────────────────────────────────┤');
  for (const account of adminAccounts) {
    const role = account.role.padEnd(12);
    const email = account.email.padEnd(30);
    console.log(`│ ${role} │ ${email} │ ${isGenerated ? 'created' : 'created'} │`);
  }
  console.log('└─────────────────────────────────────────────────────────────────┘');
  if (isGenerated) {
    console.log(`\n🔑 Generated admin password: ${password}`);
    console.log('   Save it now - it is not stored anywhere and cannot be recovered.');
  }
  console.log('\n⚠️  IMPORTANT: Change these passwords after first login!');
}

async function seedServiceCategories() {
  console.log('\n🌱 Starting service categories seed...\n');

  await prisma.$transaction(async (tx) => {
    // Upsert each category
    for (const category of serviceCategories) {
      const { serviceSlugs, ...categoryData } = category;

      const upsertedCategory = await tx.serviceCategory.upsert({
        where: { slug: category.slug },
        update: {
          name: categoryData.name,
          description: categoryData.description,
          icon: categoryData.icon,
          displayOrder: categoryData.displayOrder,
          isActive: true,
        },
        create: {
          ...categoryData,
          isActive: true,
        },
      });

      console.log(`✅ Upserted category: ${upsertedCategory.name} (${upsertedCategory.slug})`);

      // Link existing services to this category
      const updateResult = await tx.service.updateMany({
        where: {
          slug: { in: serviceSlugs },
        },
        data: {
          categoryId: upsertedCategory.id,
        },
      });

      if (updateResult.count > 0) {
        console.log(`   📎 Linked ${updateResult.count} service(s) to category`);
      }
    }
  });

  // Summary
  const categories = await prisma.serviceCategory.findMany({
    include: { _count: { select: { services: true } } },
    orderBy: { displayOrder: 'asc' },
  });

  console.log('\n📊 Service categories summary:');
  console.log('┌────────────────────────────────────────────────────────────────────┐');
  console.log('│ Category                      │ Slug                  │ Services  │');
  console.log('├────────────────────────────────────────────────────────────────────┤');
  for (const cat of categories) {
    const name = cat.name.padEnd(29);
    const slug = cat.slug.padEnd(21);
    const count = String(cat._count.services).padStart(2);
    console.log(`│ ${name} │ ${slug} │ ${count}        │`);
  }
  console.log('└────────────────────────────────────────────────────────────────────┘');
}

async function main() {
  try {
    await seedAdminUsers();
    await seedServiceCategories();
    console.log('\n🎉 Seed completed successfully!');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

