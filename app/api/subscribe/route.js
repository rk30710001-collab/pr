
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error("Upstash Redis environment variables are missing.");
  }

  return new Redis({ url, token });
}

export async function POST(request) {
  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription." },
        { status: 400 }
      );
    }

    await getRedis().set("push-subscription", subscription);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("subscribe error:", err);

    return NextResponse.json(
      { error: "Could not save subscription." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    await getRedis().del("push-subscription");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("unsubscribe error:", err);

    return NextResponse.json(
      { error: "Could not remove subscription." },
      { status: 500 }
    );
  }
}
