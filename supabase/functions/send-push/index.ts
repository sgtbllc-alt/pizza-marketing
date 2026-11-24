import webpush from 'npm:web-push@3.6.7';
import { body, HttpError, requireAdmin, serve, setting, siteOrigin, uuid, validEndpoint } from '../_shared/push.ts';

const PHONE = /^\+1\d{10}$/;
const DEVICE_CODE = /^[0-9a-f]{8}$/i;

serve(async req => {
  const client = await requireAdmin(req);
  const input = await body(req);
  if (!input || !['test', 'all', 'one'].includes(input.audience) || !uuid(input.campaignId) ||
      typeof input.title !== 'string' || !input.title.trim() || input.title.length > 80 ||
      typeof input.message !== 'string' || !input.message.trim() || input.message.length > 240 ||
      (input.audience === 'test' && !uuid(input.deviceId)) ||
      (input.audience === 'one' && !(typeof input.target === 'string' && (PHONE.test(input.target) || DEVICE_CODE.test(input.target)))) ||
      (input.cursor != null && !uuid(input.cursor)) ||
      (input.dealId != null && !uuid(input.dealId)) ||
      (input.callButton != null && typeof input.callButton !== 'boolean')) throw new HttpError(400, 'Invalid notification.');
  let query = client.from('push_subscriptions').select('id, endpoint, p256dh, auth').order('id').limit(51);
  if (input.audience === 'test') query = query.eq('id', input.deviceId);
  else if (input.audience === 'one' && PHONE.test(input.target)) query = query.eq('phone', input.target);
  else if (input.audience === 'one') {
    // Device code = first 8 hex characters of the device id (shown on the customer's status page).
    const code = input.target.toLowerCase();
    query = query.gte('id', `${code}-0000-0000-0000-000000000000`).lte('id', `${code}-ffff-ffff-ffff-ffffffffffff`);
  }
  else if (input.cursor) query = query.gt('id', input.cursor);
  const { data, error } = await query;
  if (error) throw error;
  if (input.audience === 'test' && !data?.length) throw new HttpError(400, 'Enable notifications on this device first.');
  if (input.audience === 'one' && !data?.length) {
    throw new HttpError(404, 'No device with notifications on was found for that phone number or device code.');
  }
  webpush.setVapidDetails(setting('VAPID_SUBJECT'), setting('VAPID_PUBLIC_KEY'), setting('VAPID_PRIVATE_KEY'));
  // Tapping always opens a deal page: the chosen deal's own page, or today's deals.
  // The optional "Call us" button shows on Android and computers (iPhone web notifications have no buttons).
  const tapUrl = input.dealId ? `${siteOrigin()}/deals/${input.dealId}` : `${siteOrigin()}/deals`;
  const callAction = input.callButton === true;
  const payload = JSON.stringify({ notification: {
    title: input.title.trim(), body: input.message.trim(),
    icon: `${siteOrigin()}/icons/icon-192x192.png`, tag: input.campaignId,
    ...(callAction ? { actions: [{ action: 'call', title: 'Call us' }] } : {}),
    data: { onActionClick: {
      default: { operation: 'navigateLastFocusedOrOpen', url: tapUrl },
      ...(callAction ? { call: { operation: 'openWindow', url: `${siteOrigin()}/call?auto=1` } } : {}),
    } },
  } });
  const rows = (data ?? []).slice(0, 50);
  let sent = 0, failed = 0, expired = 0;
  // Small concurrent groups keep each request bounded; the admin advances the cursor.
  for (let i = 0; i < rows.length; i += 10) {
    await Promise.all(rows.slice(i, i + 10).map(async row => {
      if (!validEndpoint(row.endpoint)) { failed++; return; }
      try {
        await webpush.sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload,
          { TTL: 3600, urgency: 'normal', timeout: 10000 });
        sent++;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          const { error: deleteError } = await client.from('push_subscriptions').delete().eq('id', row.id).eq('endpoint', row.endpoint);
          if (deleteError) failed++; else expired++;
        } else failed++;
      }
    }));
  }
  return { sent, failed, expired, nextCursor: (data?.length ?? 0) > 50 ? rows.at(-1)!.id : null };
});
