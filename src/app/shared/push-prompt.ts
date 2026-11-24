import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, afterNextRender, inject, signal, viewChild } from '@angular/core';

import { STORE } from '../core/data/store.data';
import { InstallService } from '../core/services/install.service';
import { IosInstallSteps } from './ios-install-steps';
import { ShareHint, currentDevice, shareHint } from './share-hint';
import { PushService } from '../core/services/push.service';

/** localStorage key: when the visitor last chose "Not now". */
export const PUSH_PROMPT_DISMISSED_KEY = 'mmk_push_prompt_dismissed_at';
/** Ask again after this long if the visitor said "Not now". */
const REASK_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

type PromptMode = 'hidden' | 'ask' | 'install' | 'done';

/**
 * Pop-up that asks a signed-up customer to turn on deal notifications.
 *
 * - Browsers that support push: one tap on "Turn on notifications" shows the system permission prompt
 *   (the request must come straight from a tap, which is why this is a button, not automatic).
 * - iPhone/iPad in Safari: Apple only allows push from a Home Screen app, so it shows those steps instead.
 *   When the customer opens the Home Screen app, the pop-up appears again in "ask" mode.
 * - Never shows for visitors who have not signed up, who already enabled push, who blocked it,
 *   or who chose "Not now" in the last 14 days. Signing up again clears "Not now".
 */
@Component({
  selector: 'app-push-prompt',
  imports: [IosInstallSteps],
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (mode() !== 'hidden') {
      <div class="backdrop" (click)="dismiss()"></div>
      @if (mode() === 'install') {
        <div class="hint-arrow" [class]="'hint-arrow ' + hint().position" aria-hidden="true" data-testid="share-arrow">
          <span class="hint-label">Tap here to start</span>
          <span class="hint-chevron">{{ hint().position === 'top-right' ? '↑' : '↓' }}</span>
        </div>
      }
      <div class="dialog" [class.top]="mode() === 'install' && hint().position !== 'top-right'" role="dialog" aria-modal="true"
        aria-labelledby="push-prompt-title" data-testid="push-prompt">
        <div class="icon" aria-hidden="true">{{ reward.emoji }}</div>

        @switch (mode()) {
          @case ('ask') {
            <h2 id="push-prompt-title">One tap to a {{ reward.short }}</h2>
            <p>Turn on deal notifications and your next soda is on us. We'll also send you pizza specials first. Turn them off anytime.</p>
            @if (push.message()) {
              <p class="note" role="status">{{ push.message() }}</p>
            }
            <div class="actions">
              <button #primary type="button" class="primary" data-testid="push-prompt-enable"
                [disabled]="push.busy()" (click)="enable()">
                {{ push.busy() ? 'Turning on…' : 'Turn on notifications' }}
              </button>
              @if (installer.canInstall()) {
                <button type="button" class="secondary" data-testid="push-prompt-install" (click)="install()">Install the app</button>
              }
              <button type="button" class="secondary" (click)="dismiss()">Not now</button>
            </div>
            <p class="terms">{{ reward.terms }}</p>
          }
          @case ('install') {
            <h2 id="push-prompt-title">3 steps to a {{ reward.short }}</h2>
            <p>Add us to your Home Screen and turn on deal alerts. Takes 10 seconds:</p>
            <app-ios-install-steps [hint]="hint()" />
            <p class="terms">{{ reward.terms }}</p>
            <div class="actions">
              <button #primary type="button" class="primary" (click)="dismiss()">Got it</button>
            </div>
          }
          @case ('done') {
            <h2 id="push-prompt-title">Your {{ reward.short }} is unlocked!</h2>
            <p>Show the green <strong class="tick-inline">✓</strong> page at the counter on your next visit. Tap the ✓ at the top of the app to open it.</p>
            @if (installer.canInstall()) {
              <p>Add the app to your home screen for one-tap ordering.</p>
            }
            <div class="actions">
              @if (installer.canInstall()) {
                <button type="button" class="primary" data-testid="push-prompt-install" (click)="install()">Install the app</button>
              }
              <button #primary type="button" [class.primary]="!installer.canInstall()" [class.secondary]="installer.canInstall()" (click)="close()">Continue</button>
            </div>
          }
        }
      </div>
    }
  `,
  styles: `
    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 30, 25, 0.55);
    }
    .dialog {
      position: fixed;
      z-index: 1001;
      left: 50%;
      bottom: max(16px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      width: min(calc(100% - 32px), 420px);
      max-height: calc(100dvh - 32px);
      overflow-y: auto;
      padding: 24px 20px 20px;
      border-top: 6px solid #b2292e;
      border-radius: 14px;
      background: #fff;
      color: #1f1814;
      text-align: center;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.3);
    }
    @media (min-width: 600px) {
      .dialog {
        top: 50%;
        bottom: auto;
        transform: translate(-50%, -50%);
      }
    }
    .dialog.top {
      top: max(12px, env(safe-area-inset-top));
      bottom: auto;
      transform: translateX(-50%);
      max-height: calc(100dvh - 120px);
    }
    .hint-arrow {
      position: fixed;
      z-index: 1002;
      left: 50%;
      bottom: max(6px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      display: grid;
      justify-items: center;
      color: #fff;
      font-weight: 900;
      text-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
      pointer-events: none;
      animation: nudge-down 1s ease-in-out infinite;
    }
    .hint-arrow.bottom-right {
      right: 10px;
      left: auto;
      transform: none;
      justify-items: end;
    }
    .hint-arrow.top-right {
      top: max(6px, env(safe-area-inset-top));
      right: 10px;
      bottom: auto;
      left: auto;
      transform: none;
      justify-items: end;
      animation-name: nudge-up;
    }
    .hint-arrow.top-right .hint-chevron {
      order: -1;
    }
    .hint-label {
      padding: 4px 10px;
      border-radius: 999px;
      background: #b2292e;
      font-size: 0.85rem;
      text-shadow: none;
    }
    .hint-chevron {
      font-size: 2.2rem;
      line-height: 1;
    }
    @keyframes nudge-down {
      50% { translate: 0 8px; }
    }
    @keyframes nudge-up {
      50% { translate: 0 -8px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .hint-arrow { animation: none; }
    }
    .icon {
      font-size: 2.4rem;
      line-height: 1;
    }
    h2 {
      margin: 10px 0 8px;
      color: #004438;
      font-size: 1.35rem;
    }
    p,
    ol {
      margin: 0 0 12px;
      color: #4f433e;
      line-height: 1.5;
    }
    ol {
      padding-left: 1.3em;
      text-align: left;
    }
    li + li {
      margin-top: 6px;
    }
    .terms {
      margin: 12px 0 0;
      color: #9a8b83;
      font-size: 0.72rem;
      line-height: 1.35;
    }
    .tick-inline {
      display: inline-grid;
      place-items: center;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #2fb36d;
      color: #fff;
      font-size: 0.7rem;
    }
    .note {
      color: #b2292e;
      font-weight: 700;
    }
    .actions {
      display: grid;
      gap: 8px;
      margin-top: 16px;
    }
    button {
      padding: 13px 16px;
      border-radius: 10px;
      font: inherit;
      font-weight: 850;
      cursor: pointer;
    }
    button:focus-visible {
      outline: 4px solid rgba(245, 217, 63, 0.7);
      outline-offset: 2px;
    }
    .primary {
      border: 0;
      background: #f5d93f;
      color: #004438;
    }
    .primary:disabled {
      opacity: 0.6;
      cursor: default;
    }
    .secondary {
      border: 2px solid #d9cfc7;
      background: #fff;
      color: #4f433e;
    }
  `,
})
export class PushPrompt {
  protected readonly push = inject(PushService);
  protected readonly installer = inject(InstallService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly primary = viewChild<ElementRef<HTMLButtonElement>>('primary');

  protected readonly mode = signal<PromptMode>('hidden');
  protected readonly reward = STORE.pushReward;
  /** Where Share is on this phone's browser, for the arrow and step 1 (see share-hint.ts). */
  protected readonly hint = signal<ShareHint>(shareHint({ userAgent: '', platform: '', maxTouchPoints: 0, landscape: false }));

  constructor() {
    // Browser-only: reads localStorage and push capabilities. Never runs while pre-rendering.
    afterNextRender(() => void this.decide());
  }

  private async decide(): Promise<void> {
    if (!this.isBrowser || !shouldOffer()) return;

    if (this.push.needsHomeScreen) {
      this.hint.set(shareHint(currentDevice()));
      // Turning the phone sideways moves Safari's toolbar on older iPhones.
      window.addEventListener('resize', () => this.hint.set(shareHint(currentDevice())));
      this.open('install');
      return;
    }
    if (!this.push.supported || this.push.denied) return;

    await this.push.initialize();
    if (this.push.ready() && !this.push.enabled() && !this.push.denied) {
      this.open('ask');
    }
  }

  protected async enable(): Promise<void> {
    await this.push.enable();
    if (this.push.enabled()) {
      this.open('done');
    }
    // Otherwise stay open: push.message() explains what happened (e.g. blocked in settings).
  }

  protected async install(): Promise<void> {
    await this.installer.install();
    // Installing does not replace the notification choice; the pop-up stays in its current step.
  }

  protected dismiss(): void {
    if (this.mode() === 'done') {
      this.close();
      return;
    }
    localStorage.setItem(PUSH_PROMPT_DISMISSED_KEY, String(Date.now()));
    this.close();
  }

  protected onEscape(): void {
    if (this.mode() !== 'hidden') this.dismiss();
  }

  protected close(): void {
    this.mode.set('hidden');
  }

  private open(mode: PromptMode): void {
    this.mode.set(mode);
    setTimeout(() => this.primary()?.nativeElement.focus());
  }
}

function shouldOffer(): boolean {
  if (localStorage.getItem('customer_signed_up') !== 'true') return false;
  const dismissedAt = Number(localStorage.getItem(PUSH_PROMPT_DISMISSED_KEY) ?? 0);
  return !dismissedAt || Date.now() - dismissedAt > REASK_AFTER_MS;
}
