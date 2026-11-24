# Pizza app push notifications

The website now contains customer opt-in controls on signup and deals pages, plus
`/admin/send-push` for an authenticated administrator. SMS remains separate.
The implementation uses standard Web Push and the existing Angular service worker.

## One-time Supabase setup

Target project: `xnjofnibkiouqhkbqfqr`. These changes do not modify existing SMS functions or tables.

1. In Supabase **SQL Editor**, run the contents of
   `supabase/migrations/20261116000100_push_subscriptions.sql` once.
   It creates `push_subscriptions`, enables RLS, and denies direct access to browser roles.
   Device subscriptions are handled by the Edge Function using a random device credential;
   customer phone numbers and SMS signup flags are not treated as authentication.
2. In **Authentication → Users**, copy the UUID of the administrator who already signs
   in to this app. Choose a contact email for Web Push provider correspondence.
3. From the project root, generate the keys:

   ```sh
   node scripts/create-push-secrets.mjs ADMIN_USER_UUID CONTACT_EMAIL
   ```

   This creates `supabase/.env.push` with mode 0600; it is excluded from Git.
   It contains the public/private VAPID keys, contact address, site origin and admin
   UUID allowlist. Preserve these keys: replacing them invalidates existing subscriptions.
   Additional admins can be added as comma-separated UUIDs in `PUSH_ADMIN_IDS`.
4. Sign in to the Supabase CLI and deploy:

   ```sh
   npx supabase login
   npx supabase secrets set --env-file supabase/.env.push --project-ref xnjofnibkiouqhkbqfqr
   npx supabase functions deploy push-config --project-ref xnjofnibkiouqhkbqfqr
   npx supabase functions deploy push-subscribe --project-ref xnjofnibkiouqhkbqfqr
   npx supabase functions deploy send-push --project-ref xnjofnibkiouqhkbqfqr
   ```

   `supabase/config.toml` disables the legacy gateway JWT check for these functions.
   `send-push` explicitly validates the bearer token with Supabase Auth and checks
   `PUSH_ADMIN_IDS` before reading subscriptions or sending. Never remove that check.
   `push-config` and `push-subscribe` are public so customers do not need an account.
   Do not add service-role credentials or the private VAPID key to Angular environments.
5. Build and push the reviewed website changes to `main`. The existing GitHub Actions
   workflow publishes the Angular app to GitHub Pages. It does not deploy Supabase.

The public key comes from `push-config`, so there is no key to copy into frontend code.
Existing installations may need to close and reopen after the updated service worker installs.

## Verify on a real device before broadcasting

- iPhone/iPad: iOS/iPadOS 16.4+, Safari → Share → Add to Home Screen, then launch the
  Home Screen app. Tap **Enable notifications** and allow the system prompt.
- Android: open the production HTTPS site or installed app and enable notifications.
- Sign into `/admin-login` using an allowlisted admin, then open **Send push notification**.
- Enable notifications in that same browser/app context, enter a title/message and
  use **Send test to this device**. Confirm receipt while the app is backgrounded.
- Tap the notification and confirm `/deals` opens. Test **Turn off notifications**;
  a subsequent test should report that the device is not subscribed.
- Denied permissions must be changed in the phone/browser settings; the site cannot
  override them. Opening the ordinary iPhone browser tab does not replace Home Screen installation.

## Sending and limits

The admin may prefill a message from a deal or enter a custom title/body. Broadcasts
require confirmation and run in batches of 50, with at most 10 simultaneous sends.
Keep the admin page open until it finishes. Do not blindly retry a partially failed
broadcast: previous batches, or a request whose response was lost, may already have sent.
A stable notification tag is used within a broadcast, but this is not an exactly-once queue.
Provider acceptance does not guarantee the customer sees a notification. Focus mode,
network conditions and device settings affect delivery. Notifications expire after one hour.
Expired endpoints (HTTP 404/410) are removed. Other failures are counted without logging
customer endpoints or subscription keys. The public subscription endpoint accepts only
known HTTPS push provider hosts to avoid sending requests to arbitrary addresses.

Registration is anonymous and protected by a per-device random credential, with no
public table read access. Before a large/public promotion, add abuse controls (for example
CAPTCHA or a gateway rate limit) if registration spam becomes a concern. For large campaigns
or reliable background retries, replace the browser-driven batches with a durable job queue.
Subscriptions are refreshed when a customer reopens the app; devices that clear local storage
should turn off their old browser subscription and enable it again if registration conflicts.

## Local checks

```sh
npm run build
npm test -- --watch=false --include='src/app/core/services/push.service.spec.ts'
npx deno check --config supabase/functions/deno.json supabase/functions/push-config/index.ts supabase/functions/push-subscribe/index.ts supabase/functions/send-push/index.ts
npx deno test --config supabase/functions/deno.json --allow-env supabase/functions/_shared/push_test.ts
```

Web Push is disabled in `ng serve` development mode by the existing app configuration.
Use the production HTTPS site or serve a production build on localhost for worker testing.
For local Edge Function testing, use a separate environment file with `PUSH_SITE_URL`
set to the exact localhost origin. Do not change the production origin for local testing.
