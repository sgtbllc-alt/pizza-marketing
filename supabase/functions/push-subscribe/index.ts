import { body, db, HttpError, secretHash, serve, uuid, validEndpoint, validKey } from '../_shared/push.ts';
serve(async req => {
  const input = await body(req);
  if (!input || !uuid(input.deviceId) || !validKey(input.deviceSecret, 32) ||
      !['subscribe', 'unsubscribe'].includes(input.action)) throw new HttpError(400, 'Invalid device registration.');
  const client = db();
  const hash = await secretHash(input.deviceSecret);
  const { data: existing, error: readError } = await client.from('push_subscriptions')
    .select('id, device_secret_hash, created_at').eq('id', input.deviceId).maybeSingle();
  if (readError) throw readError;
  if (existing && existing.device_secret_hash !== hash) throw new HttpError(403, 'Device authorization failed.');
  if (input.action === 'unsubscribe') {
    const { error } = await client.from('push_subscriptions').delete().eq('id', input.deviceId).eq('device_secret_hash', hash);
    if (error) throw error;
    return { ok: true };
  }
  const subscription = input.subscription;
  if (!validEndpoint(subscription?.endpoint) || !validKey(subscription?.keys?.p256dh, 65) || !validKey(subscription?.keys?.auth, 16)) {
    throw new HttpError(400, 'Unsupported or invalid push subscription.');
  }
  const values = { endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth, updated_at: new Date().toISOString() };
  const { data: saved, error } = existing
    ? await client.from('push_subscriptions').update(values).eq('id', input.deviceId).eq('device_secret_hash', hash)
      .select('created_at').single()
    : await client.from('push_subscriptions').insert({ ...values, id: input.deviceId, device_secret_hash: hash })
      .select('created_at').single();
  if (error?.code === '23505') throw new HttpError(409, 'This device is already registered. Turn notifications off, then enable them again.');
  if (error) throw error;
  // When this device first turned notifications on (server time), shown on the customer's status page.
  return { ok: true, enabledAt: saved?.created_at ?? existing?.created_at ?? null };
});
