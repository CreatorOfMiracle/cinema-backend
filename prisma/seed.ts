import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.hall.upsert({
    where: { id: 'hall-1' },
    update: { name: 'Зал 1', capacity: 60 },
    create: { id: 'hall-1', name: 'Зал 1', capacity: 60 },
  });

  await prisma.hall.upsert({
    where: { id: 'hall-2' },
    update: { name: 'Зал 2', capacity: 90 },
    create: { id: 'hall-2', name: 'Зал 2', capacity: 90 },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

