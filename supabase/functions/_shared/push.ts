import { createClient } from 'npm:@supabase/supabase-js@2.105.4';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export function setting(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new HttpError(503, 'Notifications are not configured yet.');
  return value;
}
export function siteOrigin(): string { return new URL(setting('PUSH_SITE_URL')).origin; }
export function db() {
  return createClient(setting('SUPABASE_URL'), setting('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export function serve(handler: (req: Request) => Promise<unknown>, methods = ['POST']) {
  Deno.serve(async req => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': [...methods, 'OPTIONS'].join(', '), 'Vary': 'Origin',
    };
    try {
      const origin = req.headers.get('origin');
      if (origin && origin !== siteOrigin()) throw new HttpError(403, 'Origin is not allowed.');
      if (origin) headers['Access-Control-Allow-Origin'] = origin;
      if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
      if (!methods.includes(req.method)) throw new HttpError(405, 'Method not allowed.');
      return new Response(JSON.stringify(await handler(req)), { headers });
    } catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      return new Response(JSON.stringify({ error: error instanceof HttpError ? error.message : 'Notification request failed.' }), { status, headers });
    }
  });
}
export async function body(req: Request) {
  const text = await req.text();
  if (text.length > 12000) throw new HttpError(413, 'Request too large.');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'Invalid JSON.'); }
}
export function uuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
export function validEndpoint(value: unknown): value is string {
  if (typeof value !== 'string' || value.length > 4096) return false;
  try {
    const url = new URL(value);
    const host = url.hostname;
    return url.protocol === 'https:' && !url.username && !url.password && !url.port && !url.hash &&
      (host === 'fcm.googleapis.com' || host === 'web.push.apple.com' ||
       host.endsWith('.push.apple.com') || host === 'updates.push.services.mozilla.com' ||
       host.endsWith('.notify.windows.com'));
  } catch { return false; }
}
export function validKey(value: unknown, bytes: number): value is string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) return false;
  try { return atob(value.replace(/-/g, '+').replace(/_/g, '/')).length === bytes; } catch { return false; }
}
export async function secretHash(secret: string) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))))
    .map(b => b.toString(16).padStart(2, '0')).join('');
}
export async function requireAdmin(req: Request) {
  const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) throw new HttpError(401, 'Admin login required.');
  const client = db();
  const { data, error } = await client.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Please sign in again.');
  const allowed = setting('PUSH_ADMIN_IDS').split(',').map(s => s.trim());
  if (!allowed.includes(data.user.id)) throw new HttpError(403, 'This account cannot send notifications.');
  return client;
}
