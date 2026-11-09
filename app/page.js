
"use client";

import { useEffect, useState } from "react";

const quotes = require("../lib/quotes").quotes;

const photos = [
  "/photo.jpg",
  "/photo2.jpg",
  "/photo3.jpg",
  "/photo4.jpg",
  "/photo5.jpg",
];

function getTodaysQuoteIndex() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const now = new Date();
  const dayOfYear = Math.floor(
    (now - start) / (1000 * 60 * 60 * 24)
  );
  return dayOfYear % quotes.length;
}

function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";

  return "Good Night";
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);

  return Uint8Array.from(
    [...rawData].map((c) => c.charCodeAt(0))
  );
}

export default function Home() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [photoIndex, setPhotoIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(getTodaysQuoteIndex);
  const [greeting, setGreeting] = useState(getGreeting);

  const todaysQuote = quotes[quoteIndex];

  useEffect(() => {
    checkExistingSubscription();

    const photoTimer = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % photos.length);
    }, 5000);

    const quoteTimer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 7000);

    const greetingTimer = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);

    return () => {
      clearInterval(photoTimer);
      clearInterval(quoteTimer);
      clearInterval(greetingTimer);
    };
  }, []);

  async function checkExistingSubscription() {
    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
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
      console.error("Subscription check failed:", e);
    }
  }

  async function subscribe() {
    setStatus("checking");
    setMessage("");

    if (
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setStatus("unsupported");
      setMessage(
        "This browser can't receive notifications. On iPhone, add this site to your Home Screen first."
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("denied");
        setMessage(
          "Notifications were blocked. You can turn them back on in your browser's site settings."
        );
        return;
      }

      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const publicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        setStatus("error");
        setMessage(
          "Site isn't fully configured yet — the VAPID public key is missing."
        );
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(publicKey),
      });

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      if (!res.ok) {
        throw new Error("Subscription save failed");
      }

      setStatus("subscribed");
      setMessage(
        "You're all set — a little note will land every morning."
      );
    } catch (err) {
      console.error(err);
      setStatus("error");
      setMessage(
        "Something went wrong turning this on. Give it another try?"
      );
    }
  }

  return (
    <main className="page">
      <div className="background-slideshow">
        {photos.map((photo, index) => (
          <div
            key={photo}
            className={`background-slide ${
              photoIndex === index ? "active" : ""
            }`}
            style={{
              backgroundImage: `url("${photo}")`,
            }}
          />
        ))}
      </div>

      <div className="background-overlay" />

      <span className="sparkle sparkle-one">✨</span>
      <span className="sparkle sparkle-two">💛</span>
      <span className="sparkle sparkle-three">🌸</span>

      <div className="card">
        <div className="photo-wrap">
          <img src="/photo.jpg" alt="A special memory" />
        </div>

        <p className="eyebrow">
          A little morning ritual
        </p>

        <h1 className="greeting">
          {greeting}, <em>Prakriti</em>
        </h1>

        <div className="quote-card" key={quoteIndex}>
          <p className="quote-text">
            &ldquo;{todaysQuote}&rdquo;
          </p>

          <p className="quote-date">
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {status === "subscribed" ? (
          <>
            <button className="btn btn-primary" disabled>
              Notifications are on{" "}
              <span className="heart">♥</span>
            </button>

            <p className="status success">
              {message ||
                "You're set — a note arrives every morning."}
            </p>
          </>
        ) : (
          <button
            className="btn btn-primary"
            onClick={subscribe}
            disabled={status === "checking"}
          >
            {status === "checking"
              ? "Turning on…"
              : "Turn on morning notifications"}
          </button>
        )}

        {(status === "unsupported" ||
          status === "denied" ||
          status === "error") && (
          <p className="status error">{message}</p>
        )}

        <p className="footer-note">
          Made with a lot of love, one quiet notification at a time.
        </p>
      </div>
    </main>
  );
}
