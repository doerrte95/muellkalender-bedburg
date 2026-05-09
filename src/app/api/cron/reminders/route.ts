import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';
import { isSameDay, addDays, parseISO } from 'date-fns';

const prisma = new PrismaClient();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:test@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function GET(req: Request) {
  try {
    // Überprüfen, ob der Aufruf durch Vercel Cron erfolgt (optionaler Schutz)
    // const authHeader = req.headers.get('authorization');
    // if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return new NextResponse('Unauthorized', { status: 401 });
    // }

    const subscriptions = await prisma.pushSubscription.findMany();
    if (subscriptions.length === 0) {
      return NextResponse.json({ success: true, message: 'No subscriptions found' });
    }

    // Heutiges Datum und aktuelle Stunde (für Reminder-Time Filter)
    const today = new Date();
    // UTC Hour + 2 für lokale DE-Zeit grob geschätzt (oder man speichert UTC-Zeiten).
    // Für Einfachheit nehmen wir an, dass die Cron-Routine etwa stündlich läuft und wir die lokale Zeit abgleichen:
    const localHour = new Date(today.getTime() + 2 * 60 * 60 * 1000).getUTCHours();
    const currentHourString = `${localHour.toString().padStart(2, '0')}:00`;

    // Wir filtern Abos, die in dieser Stunde eine Erinnerung wollen
    const subscriptionsToProcess = subscriptions.filter(sub => {
      // Vereinfacht: Cron läuft jede Stunde, wir triggern wenn die Stunde (z.B. "18:00") übereinstimmt
      return sub.reminderTime.startsWith(localHour.toString().padStart(2, '0'));
    });

    if (subscriptionsToProcess.length === 0) {
      return NextResponse.json({ success: true, message: 'No reminders scheduled for this hour' });
    }

    // Gruppiere nach Strasse & Hausnummer, um API-Aufrufe zu minimieren
    const addressGroups: Record<string, typeof subscriptionsToProcess> = {};
    for (const sub of subscriptionsToProcess) {
      const key = `${sub.streetId}_${sub.houseNr}`;
      if (!addressGroups[key]) addressGroups[key] = [];
      addressGroups[key].push(sub);
    }

    let notificationsSent = 0;

    for (const [key, subs] of Object.entries(addressGroups)) {
      const [streetId, houseNr] = key.split('_');
      const year = today.getFullYear();
      
      const url = `https://buerger-portal-bedburg.azurewebsites.net/api/AbfuhrtermineAbJahr?orteId=1&strassenId=${streetId}&ortsteil='Rath'&hausNr='${houseNr}'&jahr=${year}`;
      
      // Nutze den Proxy-Aufruf oder direkten Aufruf. Da wir Server-Side sind, brauchen wir eigentlich keinen Proxy, aber wir nehmen ihn wegen möglicher CORS-Einschränkungen (obwohl Server-Side meist CORS ignoriert). Direkter Aufruf:
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) continue;

      const data = await response.json();
      const results = data.d?.results || data.d || data.value || data || [];
      const collections = Array.isArray(results) ? results : [];

      for (const sub of subs) {
        // Prüfe auf Leerungen, die (heute + reminderDays) stattfinden
        const targetDate = addDays(today, sub.reminderDays);
        
        const upcomingForSub = collections.filter(c => isSameDay(parseISO(c.Datum), targetDate));
        
        if (upcomingForSub.length > 0) {
          const wasteTypes = upcomingForSub.map(c => c.AbfallartName).join(', ');
          
          let dayText = 'Heute';
          if (sub.reminderDays === 1) dayText = 'Morgen';
          if (sub.reminderDays === 2) dayText = 'Übermorgen';

          const payload = JSON.stringify({
            title: `Müll-Erinnerung: ${dayText}`,
            body: `${wasteTypes} wird abgeholt!`,
            icon: '/icon-192x192.png'
          });

          const pushSubscription = {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth }
          };

          try {
            await webpush.sendNotification(pushSubscription, payload);
            notificationsSent++;
          } catch (error) {
            console.error(`Failed to send to ${sub.endpoint}:`, error);
            // Optional: Wenn error.statusCode === 410 (Gone), Subscription aus DB löschen
          }
        }
      }
    }

    return NextResponse.json({ success: true, sent: notificationsSent });
  } catch (error) {
    console.error('Error in cron job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
