import { serve, setting } from '../_shared/push.ts';
serve(async () => ({ publicKey: setting('VAPID_PUBLIC_KEY') }), ['GET']);
