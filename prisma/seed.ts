import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.hall.upsert({
    where: { id: 'hall-1' },
    update: { name: 'Зал (c 60 местами)', capacity: 60 },
    create: { id: 'hall-1', name: 'Зал (c 60 местами)', capacity: 60 },
  });

  await prisma.hall.upsert({
    where: { id: 'hall-2' },
    update: { name: 'Зал (c 2 местами)', capacity: 2 },
    create: { id: 'hall-2', name: 'Зал (c 2 местами)', capacity: 2 },
  });
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

