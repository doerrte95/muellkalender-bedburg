const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const subs = await prisma.pushSubscription.findMany();
  console.log(subs.length, 'subscriptions found');
}
main().finally(() => prisma.$disconnect());
