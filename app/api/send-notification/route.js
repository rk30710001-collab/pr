import { kv } from "@vercel/kv";
import webpush from "web-push";
import { NextResponse } from "next/server";
import { quotes } from "../../../lib/quotes";

// This route is called once a day by Vercel Cron (see vercel.json).
// It can also be opened in a browser / curl to send a test notification
// right now, as long as you send the correct secret (see README).

function getTodaysQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const now = new Date();
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return quotes[dayOfYear % quotes.length];
}

export async function GET(request) {
  // Vercel Cron automatically sends `Authorization: Bearer <CRON_SECRET>`
  // when a CRON_SECRET env var is set on the project. We check it here so
  // a stranger can't spam Prakriti's phone by guessing this URL.
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscription = await kv.get("push-subscription");

  if (!subscription) {
    return NextResponse.json(
      { skipped: true, reason: "No one has subscribed yet. Open the site and tap 'Turn on notifications' once." },
      { status: 200 }
    );
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:you@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const quote = getTodaysQuote();

  const payload = JSON.stringify({
    title: "Good morning, Prakriti 💛",
    body: quote,
    url: "/",
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ ok: true, sent: quote });
  } catch (err) {
    console.error("push send error", err);

    // 410 / 404 means the subscription expired or she revoked permission —
    // clear it so the site can prompt her to re-subscribe next time she visits.
    if (err.statusCode === 410 || err.statusCode === 404) {
      await kv.del("push-subscription");
    }

    return NextResponse.json({ error: "Could not send notification." }, { status: 500 });
  }
}
