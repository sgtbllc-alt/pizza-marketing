import { createECDH } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
const [adminId, contactEmail] = process.argv.slice(2);
if (!/^[0-9a-f-]{36}$/i.test(adminId ?? '') || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail ?? '')) {
  console.error('Usage: node scripts/create-push-secrets.mjs ADMIN_USER_UUID CONTACT_EMAIL');
  process.exit(1);
}
const path = 'supabase/.env.push';
if (existsSync(path)) { console.error(`${path} already exists. Keep existing keys; rotating them invalidates subscriptions.`); process.exit(1); }
const keys = createECDH('prime256v1'); keys.generateKeys();
writeFileSync(path, [
  `VAPID_PUBLIC_KEY=${keys.getPublicKey().toString('base64url')}`,
  `VAPID_PRIVATE_KEY=${keys.getPrivateKey().toString('base64url')}`,
  `VAPID_SUBJECT=mailto:${contactEmail}`,
  'PUSH_SITE_URL=https://mountainmikes-southsj.com',
  `PUSH_ADMIN_IDS=${adminId}`,
  '',
].join('\n'), { mode: 0o600, flag: 'wx' });
console.log('Created private, git-ignored supabase/.env.push. No secrets were printed.');
