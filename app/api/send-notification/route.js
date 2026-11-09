
import { Redis } from "@upstash/redis";
import webpush from "web-push";
import { NextResponse } from "next/server";
import { quotes } from "../../../lib/quotes";

export const dynamic = "force-dynamic";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis environment variables are missing.");
  }

  return new Redis({ url, token });
}

// Get current date and time in India
function getIndiaTime() {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(now);

  const hour = Number(
    parts.find((part) => part.type === "hour").value
  );

  return hour;
}

// Time-based greeting
function getGreeting() {
  const hour = getIndiaTime();

  if (hour >= 5 && hour < 12) {
    return "Good Morning";
  }

  if (hour >= 12 && hour < 17) {
    return "Good Afternoon";
  }

  if (hour >= 17 && hour < 21) {
    return "Good Evening";
  }

  return "Good Night";
}

// Get today's quote using India date
function getTodaysQuote() {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());

  const year = Number(dateParts.find(p => p.type === "year").value);
  const month = Number(dateParts.find(p => p.type === "month").value);
  const day = Number(dateParts.find(p => p.type === "day").value);

  const start = new Date(Date.UTC(year, 0, 1));
  const today = new Date(Date.UTC(year, month - 1, day));

  const dayOfYear = Math.floor(
    (today - start) / (1000 * 60 * 60 * 24)
  ) + 1;

  return quotes[dayOfYear % quotes.length];
}

export async function GET(request) {
  try {
    // Check cron security
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");

    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured." },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    // Check Redis subscription
    const redis = getRedis();
    const subscription = await redis.get("push-subscription");

    if (!subscription) {
      return NextResponse.json({
        skipped: true,
        reason: "No user has subscribed yet."
      });
    }

    // Check VAPID keys
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;

    if (!publicKey || !privateKey) {
      throw new Error("VAPID keys are missing.");
    }

    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || "mailto:you@example.com",
      publicKey,
      privateKey
    );

    // Prepare notification
    const quote = getTodaysQuote();
    const greeting = getGreeting();

    const payload = JSON.stringify({
      title: `${greeting}, Prakriti 💚`,
      body: quote,
      icon: "/photo.jpg",
      image: "/photo2.jpg",
      url: "/"
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({
      ok: true,
      title: `${greeting}, Prakriti 💚`,
      sent: quote
    });

  } catch (err) {
    console.error("Push notification error:", err);

    // Remove expired subscriptions
    if (err.statusCode === 404 || err.statusCode === 410) {
      try {
        await getRedis().del("push-subscription");
      } catch (cleanupError) {
        console.error("Subscription cleanup error:", cleanupError);
      }
    }

    return NextResponse.json(
      { error: "Could not send notification. Check server configuration." },
      { status: 500 }
    );
  }
}
