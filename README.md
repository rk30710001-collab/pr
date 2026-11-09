# Good Morning, Prakriti 💛

A tiny website that sends Prakriti one loving quote every morning as a real
phone notification — she doesn't need to open the site daily, just once, to
turn notifications on.

It's a small Next.js app, free to host on Vercel.

---

## How it actually works

- She opens the site once and taps **"Turn on morning notifications."** Her
  phone/browser asks permission; once she allows it, her phone is subscribed.
- Every day at **7:00 AM IST**, Vercel's free Cron feature automatically
  calls this app, which picks that day's quote and pushes a real
  notification to her phone — no app install, no daily visits needed.
- The quotes live in `lib/quotes.js` as a plain list of 30 lines — edit,
  add, or rewrite them any time.

This uses the **Web Push API** (the same tech behind browser notifications
from sites like Twitter/Gmail), not SMS — so it's completely free, with no
per-message cost.

**One real limitation:** on iPhone, Safari only supports this if the site
is first added to the Home Screen (Share → Add to Home Screen) and opened
from there — that's an Apple restriction, not something this app can get
around. On Android (Chrome), it works straight from the browser, no
install needed.

---

## Deploy it (about 10 minutes)

### 1. Get the code onto GitHub
- Unzip this project.
- Create a new (private is fine) repo on GitHub and push these files to it.
  (If you're not comfortable with git, you can also just drag-and-drop the
  unzipped folder into Vercel directly when importing — see step 2.)

### 2. Import into Vercel
- Go to [vercel.com](https://vercel.com) → **Add New → Project** → import
  the GitHub repo (or upload the folder).
- Framework preset: Vercel will auto-detect **Next.js**. Leave build
  settings as default.
- **Don't click Deploy yet** — add the environment variables first (next
  step), or add them after and redeploy once.

### 3. Add Vercel KV (free storage for the subscription)
- In your new project → **Storage** tab → **Create Database** → **KV**
  (Upstash Redis under the hood) → create it and **connect it to this
  project**.
- This automatically adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to
  your project's environment variables — you don't type those in yourself.

### 4. Add the rest of the environment variables
Go to **Settings → Environment Variables** and add:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | `BLzYWjcbQSyznxN8Hec-cUqyx2TTtA-GO3LHrSV0wcOQF21ZE_3gywu1RCTyf5CoghBBFaFZWVrWKOWaLkNBGFg` |
| `VAPID_PRIVATE_KEY` | `fqzAbv1Em6V4rqWpNj2R-GvsBAdpgNOzpq80JKC2xnA` |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` (any real email, used only for push-service contact info) |
| `CRON_SECRET` | make up any random string, e.g. `prakriti-morning-7294` |

The VAPID key pair above was generated fresh for this project and is ready
to use as-is — you don't have to generate your own. (If you ever want a
new pair later: `npm run generate-vapid-keys`.)

### 5. Deploy
Click **Deploy**. Vercel gives you a URL like
`https://prakriti-morning-love.vercel.app`.

### 6. Have Prakriti open it once
Send her the link. She opens it, taps **"Turn on morning notifications,"**
and allows the permission prompt. That's it — she's subscribed.

(On iPhone: she needs to tap Share → **Add to Home Screen** first, then
open the app icon from her Home Screen, then tap the button there.)

### 7. Test it right now (optional)
You don't have to wait until 7 AM. In your browser or terminal, visit:

```
https://your-site.vercel.app/api/send-notification
```

with the header `Authorization: Bearer <your CRON_SECRET>` — easiest way
is a terminal command:

```bash
curl -H "Authorization: Bearer prakriti-morning-7294" https://your-site.vercel.app/api/send-notification
```

If she's subscribed, her phone should buzz within a few seconds.

---

## Changing things later

- **Quotes:** edit `lib/quotes.js`, push the change — Vercel redeploys
  automatically.
- **Notification time:** edit the `schedule` in `vercel.json`
  (currently `"30 1 * * *"` = 7:00 AM IST). Cron times are in UTC; IST is
  UTC+5:30.
- **Photo:** replace `public/photo.jpg` (and re-run the icon crop if you
  want new app icons — or just leave `icon-192.png` / `icon-512.png` as
  they are).
- **If she gets a new phone** or clears her browser data, she just opens
  the site again and taps the button once more.

---

## Project structure

```
app/
  page.js                        the page she sees (photo, today's quote, the button)
  layout.js, globals.css          page shell + the look (fonts, colors, card, animations)
  api/subscribe/route.js          saves her push subscription to Vercel KV
  api/send-notification/route.js  called daily by Vercel Cron — sends the push
public/
  sw.js                           service worker that displays the notification
  photo.jpg, icon-192.png, icon-512.png, manifest.json
lib/
  quotes.js                       the 30 quotes
vercel.json                       the daily cron schedule
```
