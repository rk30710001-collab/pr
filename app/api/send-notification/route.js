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

function getTodaysQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const now = new Date();

  const dayOfYear = Math.floor(
    (now - start) / (1000 * 60 * 60 * 24)
  );

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

    const payload = JSON.stringify({
      title: "Good morning, Prakriti 💚",
      body: quote,
      url: "/"
    });

    await webpush.sendNotification(subscription, payload);

    return NextResponse.json({
      ok: true,
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