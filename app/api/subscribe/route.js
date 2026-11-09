import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

// This site is built for exactly one subscriber (Prakriti), so we keep this
// deliberately simple: one subscription object, stored under one fixed key.
// If you ever wanted multiple people subscribed, you'd store a list keyed
// by subscription.endpoint instead — but for this project, one is enough.

export async function POST(request) {
  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
    }

    await kv.set("push-subscription", subscription);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("subscribe error", err);
    return NextResponse.json({ error: "Could not save subscription." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await kv.del("push-subscription");
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("unsubscribe error", err);
    return NextResponse.json({ error: "Could not remove subscription." }, { status: 500 });
  }
}
