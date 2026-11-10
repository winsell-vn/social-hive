import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'testuser123@test.com';
  
  const user = await prisma.user.update({
    where: { email },
    data: { isActive: true },
  });
  
  console.log(`User ${user.email} activated successfully!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

