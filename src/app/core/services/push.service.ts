import { Injectable, inject, signal } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { supabase } from '../supabase.client';
import { PushStatusService } from './push-status.service';

export interface PushResult { sent: number; failed: number; expired: number; nextCursor: string | null; }
export interface PushMessage { title: string; message: string; audience: 'test' | 'all' | 'one'; target?: string; campaignId: string; cursor?: string; deviceId?: string; dealId?: string; callButton?: boolean; }

@Injectable({ providedIn: 'root' })
export class PushService {
  private readonly swPush = inject(SwPush);
  private readonly status = inject(PushStatusService);
  private readonly base = `${environment.supabaseUrl}/functions/v1`;
  readonly enabled = signal(false);
  readonly ready = signal(false);
  readonly busy = signal(false);
  readonly message = signal('');
  private publicKey = '';
  private initPromise?: Promise<void>;

  get needsHomeScreen(): boolean {
    const ios = !/Android/.test(navigator.userAgent) && (/iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
    return ios && !(matchMedia('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone);
  }
  get supported(): boolean {
    return isSecureContext && 'Notification' in window && 'PushManager' in window && this.swPush.isEnabled;
  }
  get denied(): boolean { return 'Notification' in window && Notification.permission === 'denied'; }

  initialize(): Promise<void> {
    return this.initPromise ??= this.prepare();
  }
  private async prepare(): Promise<void> {
    if (this.needsHomeScreen || !this.supported) return;
    try {
      const config = await this.request<{ publicKey: string }>('push-config', undefined);
      this.publicKey = config.publicKey;
      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('The app is still getting ready. Reopen it and try again.')), 35000)),
      ]);
      if (!registration.active) throw new Error('Reopen the app to finish installation.');
      const subscription = await firstValueFrom(this.swPush.subscription.pipe(timeout(5000)));
      if (subscription && localStorage.getItem('mmk_push_device')) {
        await this.save(subscription);
        this.enabled.set(true);
      }
      this.ready.set(true);
    } catch {
      this.message.set('Notifications are not available yet. Please try again later.');
      this.initPromise = undefined;
    }
  }
  async enable(): Promise<void> {
    if (!this.ready() || this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    let subscription: PushSubscription | undefined;
    try {
      // Invoke directly from the tap; do not await network/configuration before this call on iOS.
      subscription = await this.swPush.requestSubscription({ serverPublicKey: this.publicKey });
      await this.save(subscription);
      this.enabled.set(true);
      this.message.set('Pizza deal notifications are enabled on this device.');
    } catch (error) {
      if (subscription) await subscription.unsubscribe().catch(() => false);
      this.enabled.set(false);
      this.message.set(this.denied ? 'Notifications are blocked. Allow them in your device or browser notification settings, then reopen this app.' :
        error instanceof Error ? error.message : 'Could not enable notifications. Please try again.');
    } finally { this.busy.set(false); }
  }
  async disable(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      // Remove server registration first, so failure remains retryable.
      await this.request('push-subscribe', { ...this.device(), action: 'unsubscribe' });
      const subscription = await firstValueFrom(this.swPush.subscription.pipe(timeout(5000)));
      if (subscription) await subscription.unsubscribe();
      this.enabled.set(false);
      this.status.clear();
      this.message.set('Notifications are turned off on this device.');
    } catch (error) {
      this.message.set(error instanceof Error ? error.message : 'Could not turn off notifications. Please retry.');
    } finally { this.busy.set(false); }
  }
  private device(): { deviceId: string; deviceSecret: string } {
    const existing = localStorage.getItem('mmk_push_device');
    if (existing) return JSON.parse(existing);
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const device = { deviceId: crypto.randomUUID(), deviceSecret: btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') };
    localStorage.setItem('mmk_push_device', JSON.stringify(device));
    return device;
  }
  private async save(subscription: PushSubscription): Promise<void> {
    // Phone saved at signup in this browser (if any), so the admin can send a test to one number.
    const phone = localStorage.getItem('customer_phone');
    const result = await this.request<{ enabledAt?: string | null }>('push-subscribe', {
      ...this.device(), action: 'subscribe', subscription: subscription.toJSON(),
      ...(phone && /^\+1\d{10}$/.test(phone) ? { phone } : {}),
    });
    this.status.record(result?.enabledAt);
  }

  async send(input: PushMessage): Promise<PushResult> {
    const { data } = await supabase.auth.getSession();
    if (!data.session) throw new Error('Please sign in as an admin.');
    if (input.audience === 'test') {
      if (!this.enabled()) throw new Error('Enable notifications on this device first.');
      input = { ...input, deviceId: this.device().deviceId };
    }
    return this.request<PushResult>('send-push', input, data.session.access_token);
  }
  private async request<T>(name: string, body?: unknown, token?: string): Promise<T> {
    const response = await fetch(`${this.base}/${name}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', apikey: environment.supabaseAnonKey,
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'Notification service is unavailable. Please try again later.');
    return result;
  }
}
