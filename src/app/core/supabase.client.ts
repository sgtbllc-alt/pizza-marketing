import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xnjofnibkiouqhkbqfqr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_EUdf6pDD1FcCDfYPv0QeNw_lyIab6Xw';

/** Admin client: keeps the admin login session. */
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Gives up on a request after this long, so pages show an error instead of loading forever. */
export const PUBLIC_REQUEST_TIMEOUT_MS = 15000;

function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PUBLIC_REQUEST_TIMEOUT_MS);
  init?.signal?.addEventListener('abort', () => controller.abort());
  return fetch(input, { ...init, signal: controller.signal })
    .catch((error: unknown) => {
      if (controller.signal.aborted) throw new Error('The connection is slow. Please try again.');
      throw error;
    })
    .finally(() => clearTimeout(timer));
}

/**
 * Customer-facing client for public reads (deals, prize entries). It never uses the admin session:
 * an expired or stuck admin login on the same phone (e.g. after Android puts the app to sleep)
 * must not block or break the deals page.
 */
export const publicSupabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storageKey: 'mmk-public',
    lock: async (_name, _timeout, fn) => fn(),
  },
  global: { fetch: fetchWithTimeout },
});
