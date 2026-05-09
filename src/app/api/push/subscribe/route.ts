export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const getPrisma = () => {
  const globalAny: any = global;
  if (!globalAny.prisma) globalAny.prisma = new PrismaClient();
  return globalAny.prisma;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscription, streetId, houseNr, reminderDays, reminderTime } = body;

    if (!subscription || !subscription.endpoint || !streetId || !houseNr || !reminderTime) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { endpoint, keys } = subscription;

    const prisma = getPrisma();
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        p256dh: keys.p256dh,
        auth: keys.auth,
        streetId: streetId.toString(),
        houseNr: houseNr.toString(),
        reminderDays: Number(reminderDays),
        reminderTime: reminderTime.toString()
      },
      create: {
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
        streetId: streetId.toString(),
        houseNr: houseNr.toString(),
        reminderDays: Number(reminderDays),
        reminderTime: reminderTime.toString()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
