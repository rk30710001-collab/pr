// Run with: npm run generate-vapid-keys
// Prints a fresh VAPID key pair you paste into Vercel's Environment Variables.
const webpush = require("web-push");

const keys = webpush.generateVAPIDKeys();

console.log("\nPaste these into your Vercel Project → Settings → Environment Variables:\n");
console.log("NEXT_PUBLIC_VAPID_PUBLIC_KEY =", keys.publicKey);
console.log("VAPID_PRIVATE_KEY =", keys.privateKey);
console.log("\nKeep the private key secret — don't commit it or share it.\n");
