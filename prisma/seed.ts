import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Hash the password
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
    },
  });

  console.log('Created admin user:', {
    id: adminUser.id,
    email: adminUser.email,
    username: adminUser.username,
  });

  // Create or update test user
  const testUser = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      username: 'testuser',
      password: hashedPassword,
    },
  });

  console.log('Created test user:', {
    id: testUser.id,
    email: testUser.email,
    username: testUser.username,
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(
      'Error seeding database:',
      e instanceof Error ? e.message : e,
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
