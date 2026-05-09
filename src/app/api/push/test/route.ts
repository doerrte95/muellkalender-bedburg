export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { endpoint } = await req.json();

    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint required' }, { status: 400 });
    }

    const subscription = await prisma.pushSubscription.findUnique({
      where: { endpoint }
    });

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    const payload = JSON.stringify({
      title: 'Test Erinnerung',
      body: 'Das ist ein Test! Deine Benachrichtigungen funktionieren.',
      icon: '/icon-192x192.png'
    });

    await webpush.sendNotification(pushSubscription, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending test push:', error);
    return NextResponse.json({ error: 'Failed to send test push' }, { status: 500 });
  }
}
