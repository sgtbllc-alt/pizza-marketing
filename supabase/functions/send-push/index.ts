import webpush from 'npm:web-push@3.6.7';
import { body, HttpError, requireAdmin, serve, setting, siteOrigin, uuid, validEndpoint } from '../_shared/push.ts';

serve(async req => {
  const client = await requireAdmin(req);
  const input = await body(req);
  if (!input || !['test', 'all'].includes(input.audience) || !uuid(input.campaignId) ||
      typeof input.title !== 'string' || !input.title.trim() || input.title.length > 80 ||
      typeof input.message !== 'string' || !input.message.trim() || input.message.length > 240 ||
      (input.audience === 'test' && !uuid(input.deviceId)) ||
      (input.cursor != null && !uuid(input.cursor))) throw new HttpError(400, 'Invalid notification.');
  let query = client.from('push_subscriptions').select('id, endpoint, p256dh, auth').order('id').limit(51);
  if (input.audience === 'test') query = query.eq('id', input.deviceId);
  else if (input.cursor) query = query.gt('id', input.cursor);
  const { data, error } = await query;
  if (error) throw error;
  if (input.audience === 'test' && !data?.length) throw new HttpError(400, 'Enable notifications on this device first.');
  webpush.setVapidDetails(setting('VAPID_SUBJECT'), setting('VAPID_PUBLIC_KEY'), setting('VAPID_PRIVATE_KEY'));
  const payload = JSON.stringify({ notification: {
    title: input.title.trim(), body: input.message.trim(),
    icon: `${siteOrigin()}/icons/icon-192x192.png`, tag: input.campaignId,
    data: { onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url: `${siteOrigin()}/deals` } } },
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
