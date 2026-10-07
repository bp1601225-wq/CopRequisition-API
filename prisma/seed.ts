import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

import { hashPassword } from '../src/utils/password.js';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const adminName = process.env.ADMIN_NAME ?? 'System Admin';
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@company.com';
  const adminPassword = process.env.ADMIN_PASSWORD ?? 'ChangeMe123!';

  const department = await prisma.department.upsert({
    where: { name: 'Administration' },
    update: {},
    create: {
      name: 'Administration',
    },
  });

  const hashedPassword = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      password: hashedPassword,
      role: 'ADMIN',
      departmentId: department.id,
    },
    create: {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'ADMIN',
      departmentId: department.id,
    },
  });

  console.log(`Seeded Department: ${department.name}`);
  console.log(`Seeded Admin User: ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
