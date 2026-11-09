# Good Morning, Prakriti 💛

A tiny Next.js website that sends Prakriti a loving quote every morning as a real phone notification.

## How it works

- Open the website once and tap **Turn on morning notifications**.
- Allow notification permission in the browser.
- The browser subscription is saved in Redis.
- Vercel Cron automatically triggers the notification API every day at 7:00 AM IST.
- The app sends a daily quote using the Web Push API.

No daily website visit is required.

### iPhone limitation

On iPhone, Safari requires the website to be added to the Home Screen and opened from there before enabling notifications.

On Android, Chrome supports browser notifications directly.

## Project structure

```text
app/
  page.js
  layout.js
  globals.css
  api/
    subscribe/route.js
    send-notification/route.js

public/
  sw.js
  photo.jpg
  icon-192.png
  icon-512.png
  manifest.json

lib/
  quotes.js

scripts/
  generate-vapid-keys.js

vercel.json
package.json
```

## Deployment

### 1. GitHub

Push the project to a GitHub repository.

### 2. Vercel

1. Open https://vercel.com
2. Import the GitHub repository.
3. Select Next.js as the framework.
4. Keep the default build settings.

### 3. Redis database

Create an Upstash Redis database through the Vercel Marketplace and connect it to the project.

The integration provides:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

### 4. Environment variables

Add these variables in Vercel → Settings → Environment Variables:

| Name | Description |
|---|---|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Your generated VAPID public key |
| `VAPID_PRIVATE_KEY` | "pnouN0bhHiAvOut-_ThhRjakuvcsvPOdGZXVNUgi6KA" |
| `VAPID_SUBJECT` | A real email,rk30710001@gmail.com` |
| `CRON_SECRET` | i love her. |
| `UPSTASH_REDIS_REST_URL` | Provided by Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | Provided by Upstash |

Never publish private keys or tokens in GitHub.

Generate fresh VAPID keys using:

```bash
npm run generate-vapid-keys
```

### 5. Deploy

Click Deploy in Vercel and wait for the build to finish.

### 6. Enable notifications

Open the deployed website and tap **Turn on morning notifications**.

Allow browser notification permission.

### 7. Test notifications

Use this command from a terminal:

```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://YOUR_PROJECT.vercel.app/api/send-notification
```

Replace the URL and secret with your actual values.

## Daily schedule

The `vercel.json` schedule is:

```json
{
  "crons": [
    {
      "path": "/api/send-notification",
      "schedule": "30 1 * * *"
    }
  ]
}
```

This corresponds to 7:00 AM IST (01:30 UTC).

## Customization

- Edit `lib/quotes.js` to change daily quotes.
- Replace `public/photo.jpg` to change the photo.
- Edit `vercel.json` to change the notification schedule.

## Security

- Never commit `.env` or `.env.local`.
- Never publish `pnouN0bhHiAvOut-_ThhRjakuvcsvPOdGZXVNUgi6KA`.
- Never publish `CRON_SECRET`.
- Keep Redis credentials private.
