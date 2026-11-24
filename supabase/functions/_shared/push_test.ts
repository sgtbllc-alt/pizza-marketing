import { HttpError, requireAdmin, secretHash, validEndpoint, validKey } from './push.ts';
function assert(value: unknown, message = 'Assertion failed'): asserts value { if (!value) throw new Error(message); }
Deno.test('allows only HTTPS browser push provider endpoints', () => {
  for (const endpoint of ['https://web.push.apple.com/Q123', 'https://fcm.googleapis.com/fcm/send/123', 'https://updates.push.services.mozilla.com/wpush/v2/123', 'https://wns2.notify.windows.com/w/?token=123']) assert(validEndpoint(endpoint), endpoint);
  for (const endpoint of ['http://web.push.apple.com/test', 'https://localhost/test', 'https://127.0.0.1/test', 'https://evilpush.apple.com/test', 'https://web.push.apple.com.evil.test/test', 'https://user:pass@web.push.apple.com/test', 'https://web.push.apple.com:8443/test']) assert(!validEndpoint(endpoint), endpoint);
});
Deno.test('validates key lengths and hashes device credentials', async () => {
  assert(validKey('A'.repeat(87), 65)); assert(validKey('A'.repeat(22), 16));
  assert(!validKey('A'.repeat(22), 32)); assert(!validKey('invalid!', 16));
  const hash = await secretHash('device-secret'); assert(hash.length === 64); assert(hash === await secretHash('device-secret'));
});
Deno.test('sender denies missing JWT before database access', async () => {
  try { await requireAdmin(new Request('https://example.test')); throw new Error('allowed'); }
  catch (error) { assert(error instanceof HttpError && error.status === 401); }
});
Deno.test('sender checks authenticated user against server-side allowlist', async () => {
  const originalFetch = globalThis.fetch;
  Deno.env.set('SUPABASE_URL', 'https://example.supabase.co');
  Deno.env.set('SUPABASE_SERVICE_ROLE_KEY', 'test-only-key');
  Deno.env.set('PUSH_ADMIN_IDS', 'allowed-admin');
  try {
    globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify({ id: 'regular-user' }), { headers: { 'Content-Type': 'application/json' } }))) as typeof fetch;
    try { await requireAdmin(new Request('https://example.test', { headers: { Authorization: 'Bearer test-token' } })); throw new Error('allowed'); }
    catch (error) { assert(error instanceof HttpError && error.status === 403); }
    globalThis.fetch = (() => Promise.resolve(new Response(JSON.stringify({ id: 'allowed-admin' }), { headers: { 'Content-Type': 'application/json' } }))) as typeof fetch;
    assert(await requireAdmin(new Request('https://example.test', { headers: { Authorization: 'Bearer test-token' } })));
  } finally { globalThis.fetch = originalFetch; }
});
