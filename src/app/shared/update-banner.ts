import { isPlatformBrowser } from '@angular/common';
import { Component, DestroyRef, PLATFORM_ID, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';

/**
 * The service worker keeps the previous version until the app is reopened. This checks for a new
 * version when the app opens or comes back to the foreground, and offers a one-tap Refresh.
 */
@Component({
  selector: 'app-update-banner',
  template: `
    @if (updateReady()) {
      <div class="update-bar" role="status" data-testid="update-banner">
        <span>A new version of the app is ready.</span>
        <button type="button" (click)="refresh()">Refresh</button>
      </div>
    }
  `,
  styles: `
    .update-bar {
      position: fixed;
      z-index: 900;
      left: 50%;
      bottom: max(12px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 12px;
      width: max-content;
      max-width: calc(100% - 24px);
      padding: 10px 12px 10px 16px;
      border-radius: 12px;
      background: #004438;
      color: #fff;
      font-weight: 700;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
    }
    button {
      flex: none;
      padding: 8px 14px;
      border: 0;
      border-radius: 8px;
      background: #f5d93f;
      color: #004438;
      font: inherit;
      font-weight: 850;
      cursor: pointer;
    }
  `,
})
export class UpdateBanner {
  private readonly updates = inject(SwUpdate, { optional: true });
  protected readonly updateReady = signal(false);

  constructor() {
    const updates = this.updates;
    if (!isPlatformBrowser(inject(PLATFORM_ID)) || !updates?.isEnabled) return;

    updates.versionUpdates.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe((event) => {
      if (event.type === 'VERSION_READY') this.updateReady.set(true);
    });
    // The cached app can no longer load its files: reload to get the current version.
    updates.unrecoverable.pipe(takeUntilDestroyed(inject(DestroyRef))).subscribe(() => location.reload());

    const check = () => void updates.checkForUpdate().catch(() => false);
    check();
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') check();
    });
  }

  protected async refresh(): Promise<void> {
    await this.updates?.activateUpdate().catch(() => false);
    location.reload();
  }
}
