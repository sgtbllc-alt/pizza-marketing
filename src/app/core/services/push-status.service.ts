import { Injectable, signal } from '@angular/core';

const ENABLED_AT_KEY = 'mmk_push_enabled_at';

/**
 * Whether this device has notifications on, and since when (server time from push-subscribe).
 * Kept separate from PushService so the site header can show the green tick without loading
 * the service worker / push machinery on every page.
 */
@Injectable({ providedIn: 'root' })
export class PushStatusService {
  /** ISO time this device turned notifications on, or null. */
  readonly enabledAt = signal<string | null>(null);

  /** Reads the saved date; clears it if the browser no longer allows notifications. Browser only. */
  load(): void {
    const saved = localStorage.getItem(ENABLED_AT_KEY);
    const granted = typeof Notification !== 'undefined' && Notification.permission === 'granted';
    if (saved && granted) {
      this.enabledAt.set(saved);
      return;
    }
    if (saved) localStorage.removeItem(ENABLED_AT_KEY);
    this.enabledAt.set(null);
  }

  /** Saves the date from the server (falls back to an earlier saved date, then to now). */
  record(enabledAt: string | null | undefined): void {
    const value = enabledAt ?? localStorage.getItem(ENABLED_AT_KEY) ?? new Date().toISOString();
    localStorage.setItem(ENABLED_AT_KEY, value);
    this.enabledAt.set(value);
  }

  clear(): void {
    localStorage.removeItem(ENABLED_AT_KEY);
    this.enabledAt.set(null);
  }

  /** Short code identifying this device's registration, for checking against the admin side. */
  deviceCode(): string | null {
    const existing = localStorage.getItem('mmk_push_device');
    return existing ? (JSON.parse(existing).deviceId as string).slice(0, 8).toUpperCase() : null;
  }
}
