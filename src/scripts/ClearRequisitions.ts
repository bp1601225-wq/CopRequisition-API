import { prisma } from '../config/database.js';

async function ClearUsers() {
  try {
    const result = await prisma.requisition.deleteMany();

    console.log(`${result.count} requisitions deleted`);
  } catch (error) {
    console.error("Failed to delete req:", error);
  } finally {
    await prisma.$disconnect();
  }
}





// npx tsx src/scripts/clearUsers.ts
ClearUsers();
