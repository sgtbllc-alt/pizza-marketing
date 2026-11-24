import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, afterNextRender, inject, signal, viewChild } from '@angular/core';

import { STORE } from '../core/data/store.data';
import { InstallService } from '../core/services/install.service';
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
  host: { '(document:keydown.escape)': 'onEscape()' },
  template: `
    @if (mode() !== 'hidden') {
      <div class="backdrop" (click)="dismiss()"></div>
      @if (mode() === 'install') {
        <div class="hint-arrow" [class.ipad]="isIPad" aria-hidden="true" data-testid="share-arrow">
          <span class="hint-label">Share is here</span>
          <span class="hint-chevron">{{ isIPad ? '↑' : '↓' }}</span>
        </div>
      }
      <div class="dialog" [class.top]="mode() === 'install'" role="dialog" aria-modal="true"
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
            <ol class="steps">
              <li>
                <span>Tap <strong>Share</strong></span>
                <span class="chip"><svg class="share-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 10H6a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></span>
                <small>{{ isIPad ? 'Top right of Safari.' : 'Bottom of Safari. On newer iPhones, tap ••• first.' }}</small>
              </li>
              <li>
                <span>Tap</span>
                <span class="menu-row" aria-hidden="true"><span>Add to Home Screen</span><span class="plus-box">+</span></span>
                <small>Scroll down in the Share menu if you don't see it. Then tap <strong>Add</strong>.</small>
              </li>
              <li>
                <span>Open the new <strong>pizza icon</strong></span>
                <img class="app-icon" src="icons/icon-96x96.png" alt="" width="40" height="40" />
                <small>Then tap <strong>Turn on notifications</strong>.</small>
              </li>
            </ol>
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
    .steps {
      display: grid;
      gap: 12px;
      padding: 0;
      list-style: none;
      counter-reset: step;
    }
    .steps li {
      display: grid;
      grid-template-columns: 28px 1fr auto;
      grid-template-areas: 'num text pic' 'num note note';
      align-items: center;
      column-gap: 10px;
      row-gap: 2px;
      padding: 10px;
      border-radius: 10px;
      background: #fff8ed;
      text-align: left;
      counter-increment: step;
    }
    .steps li::before {
      content: counter(step);
      grid-area: num;
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #004438;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 900;
    }
    .steps li > span:first-of-type {
      grid-area: text;
      color: #1f1814;
    }
    .steps small {
      grid-area: note;
      color: #7b6b63;
      font-size: 0.8rem;
    }
    .chip,
    .menu-row,
    .app-icon {
      grid-area: pic;
    }
    .chip {
      display: grid;
      place-items: center;
      width: 38px;
      height: 38px;
      border-radius: 9px;
      background: #fff;
      color: #007aff;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }
    .share-icon {
      width: 22px;
      height: 22px;
    }
    .menu-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 8px 6px 10px;
      border-radius: 8px;
      background: #fff;
      color: #1f1814;
      font-size: 0.78rem;
      white-space: nowrap;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
    }
    .plus-box {
      display: grid;
      place-items: center;
      width: 18px;
      height: 18px;
      border: 1.5px solid #1f1814;
      border-radius: 4px;
      font-weight: 700;
      line-height: 1;
    }
    .app-icon {
      border-radius: 9px;
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
    .hint-arrow.ipad {
      top: 8px;
      right: 70px;
      bottom: auto;
      left: auto;
      transform: none;
      animation-name: nudge-up;
    }
    .hint-arrow.ipad .hint-chevron {
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
  /** iPad Safari has Share at the top right; iPhone at the bottom. */
  protected isIPad = false;

  constructor() {
    // Browser-only: reads localStorage and push capabilities. Never runs while pre-rendering.
    afterNextRender(() => void this.decide());
  }

  private async decide(): Promise<void> {
    if (!this.isBrowser || !shouldOffer()) return;

    if (this.push.needsHomeScreen) {
      this.isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
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
