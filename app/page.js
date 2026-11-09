"use client";

import { useEffect, useState } from "react";

// Must match lib/quotes.js exactly so the page shows the same line
// the morning push will send, before she's even subscribed.
const quotes = require("../lib/quotes").quotes;

function getTodaysQuote() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const now = new Date();
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return quotes[dayOfYear % quotes.length];
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export default function Home() {
  const [status, setStatus] = useState("idle"); // idle | checking | subscribed | denied | unsupported | error
  const [message, setMessage] = useState("");
  const todaysQuote = getTodaysQuote();

  useEffect(() => {
    checkExistingSubscription();
  }, []);

  async function checkExistingSubscription() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const existing = await reg.pushManager.getSubscription();
      if (existing) {
        setStatus("subscribed");
      }
    } catch (e) {
      // registration failing on first load is fine, button will retry
    }
  }

  async function subscribe() {
    setStatus("checking");
    setMessage("");

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      setMessage(
        "This browser can't receive notifications. On iPhone, add this site to your Home Screen first (Share → Add to Home Screen), then open it from there and try again."
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        setMessage("Notifications were blocked. You can turn them back on in your browser's site settings.");
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setStatus("error");
        setMessage("Site isn't fully configured yet — the VAPID public key is missing.");
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) throw new Error("save failed");

      setStatus("subscribed");
      setMessage("You're all set — a little note will land every morning.");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage("Something went wrong turning this on. Give it another try?");
    }
  }

  return (
    <main className="page">
      <span className="sparkle" style={{ top: "8%", left: "10%" }}>
        ✨
      </span>
      <span className="sparkle" style={{ top: "70%", left: "85%", animationDelay: "3s" }}>
        💛
      </span>
      <span className="sparkle" style={{ top: "20%", left: "88%", animationDelay: "6s" }}>
        🌸
      </span>

      <div className="card">
        <div className="photo-wrap">
          <img src="/photo.jpg" alt="Us" />
        </div>

        <p className="eyebrow">A little morning ritual</p>
        <h1>
          Good morning, <em>Prakriti</em>
        </h1>

        <div className="quote-card">
          <p className="quote-text">&ldquo;{todaysQuote}&rdquo;</p>
          <p className="quote-date">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>

        {status === "subscribed" ? (
          <>
            <button className="btn btn-primary" disabled>
              Notifications are on <span className="heart">♥</span>
            </button>
            <p className="status success">{message || "You're set — a note arrives every morning."}</p>
          </>
        ) : (
          <button className="btn btn-primary" onClick={subscribe} disabled={status === "checking"}>
            {status === "checking" ? "Turning on…" : "Turn on morning notifications"}
          </button>
        )}

        {status === "unsupported" && <p className="status error">{message}</p>}
        {status === "denied" && <p className="status error">{message}</p>}
        {status === "error" && <p className="status error">{message}</p>}

        <p className="footer-note">Made with a lot of love, one quiet notification at a time.</p>
      </div>
    </main>
  );
}
