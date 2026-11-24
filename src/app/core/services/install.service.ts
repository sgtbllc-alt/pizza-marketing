import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

/** Chrome/Edge/Samsung Internet event that allows showing the "Install app" dialog from our own button. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Lets the app offer "Install the app" (Android and desktop Chrome/Edge). iPhone has no install API:
 * there the visitor uses Safari's Share → Add to Home Screen.
 *
 * The browser fires `beforeinstallprompt` once, early, so `listen()` must run at app start.
 */
@Injectable({ providedIn: 'root' })
export class InstallService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private deferred: BeforeInstallPromptEvent | null = null;

  /** True when the browser will show its install dialog if we ask. */
  readonly canInstall = signal(false);
  readonly installed = signal(false);
  /** Android browser tab (not the installed app): offer Install even without Chrome's one-tap dialog. */
  readonly androidBrowser = signal(false);
  /** Show an "Install the app" option: one-tap where possible, otherwise manual steps on Android. */
  readonly offerInstall = computed(() => !this.installed() && (this.canInstall() || this.androidBrowser()));

  listen(): void {
    if (!this.isBrowser) return;
    const standalone =
      (typeof matchMedia === 'function' && matchMedia('(display-mode: standalone)').matches) ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    this.installed.set(standalone);
    this.androidBrowser.set(/Android/i.test(navigator.userAgent) && !standalone);

    // index.html catches the offer before Angular starts; pick it up if it already came.
    const early = (window as Window & { __mmkInstallPrompt?: BeforeInstallPromptEvent }).__mmkInstallPrompt;
    if (early) {
      this.deferred = early;
      this.canInstall.set(true);
    }
    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault(); // keep it for our button instead of Chrome's mini-bar
      this.deferred = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.deferred = null;
      this.canInstall.set(false);
      this.installed.set(true);
    });
  }

  /** Shows the browser's install dialog. Must be called from a tap. */
  async install(): Promise<boolean> {
    const event = this.deferred;
    if (!event) return false;
    this.deferred = null;
    (window as Window & { __mmkInstallPrompt?: unknown }).__mmkInstallPrompt = undefined;
    this.canInstall.set(false);
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') this.installed.set(true);
    return outcome === 'accepted';
  }
}
