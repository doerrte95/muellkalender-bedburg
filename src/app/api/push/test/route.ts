export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import webpush from 'web-push';


webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: Request) {
  try {
    const { subscription } = await req.json();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription required' }, { status: 400 });
    }

    const payload = JSON.stringify({
      title: 'Test Erinnerung',
      body: 'Das ist ein Test! Deine Benachrichtigungen funktionieren.',
      icon: '/icon-192x192.png'
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending test push:', error);
    return NextResponse.json({ error: 'Failed to send test push' }, { status: 500 });
  }
}
