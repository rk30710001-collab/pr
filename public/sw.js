// Service worker: receives the push event from the server and shows the
// notification on the phone/browser. This file must live at the site root
// (public/sw.js -> served at /sw.js) so its scope covers the whole site.

self.addEventListener("push", (event) => {
  let data = { title: "Good morning 💛", body: "Thinking of you.", url: "/" };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    // fall back to default above
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    image: data.image || undefined,
    tag: "morning-love-note", // replaces any previous notification instead of stacking
    renotify: true,
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Tapping the notification opens (or focuses) the site.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
