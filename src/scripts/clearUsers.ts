import { prisma } from '../config/database.js';

async function ClearUsers() {
  try {
    const result = await prisma.user.deleteMany();

    console.log(`${result.count} users deleted`);
  } catch (error) {
    console.error("Failed to delete users:", error);
  } finally {
    await prisma.$disconnect();
  }
}





// npx tsx src/scripts/clearUsers.ts
ClearUsers();
