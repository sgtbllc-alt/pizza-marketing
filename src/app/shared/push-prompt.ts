import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, PLATFORM_ID, afterNextRender, inject, signal, viewChild } from '@angular/core';

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
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="push-prompt-title" data-testid="push-prompt">
        <div class="icon" aria-hidden="true">🍕</div>

        @switch (mode()) {
          @case ('ask') {
            <h2 id="push-prompt-title">Get our deals first?</h2>
            <p>Turn on notifications and we'll send you pizza specials and giveaway news. You can turn them off anytime.</p>
            @if (push.message()) {
              <p class="note" role="status">{{ push.message() }}</p>
            }
            <div class="actions">
              <button #primary type="button" class="primary" data-testid="push-prompt-enable"
                [disabled]="push.busy()" (click)="enable()">
                {{ push.busy() ? 'Turning on…' : 'Turn on notifications' }}
              </button>
              <button type="button" class="secondary" (click)="dismiss()">Not now</button>
            </div>
          }
          @case ('install') {
            <h2 id="push-prompt-title">Get deal alerts on your iPhone</h2>
            <p>Apple only allows notifications from apps on your Home Screen. It takes 10 seconds:</p>
            <ol>
              <li>In Safari, tap the <strong>Share</strong> button <span aria-hidden="true">(□↑)</span>. It may be under the <strong>…</strong> menu.</li>
              <li>Choose <strong>Add to Home Screen</strong>, then <strong>Add</strong>.</li>
              <li>Open the new <strong>pizza icon</strong> and tap <strong>Turn on notifications</strong>.</li>
            </ol>
            <div class="actions">
              <button #primary type="button" class="primary" (click)="dismiss()">Got it</button>
            </div>
          }
          @case ('done') {
            <h2 id="push-prompt-title">You're all set!</h2>
            <p>We'll let you know when new pizza deals drop.</p>
            <div class="actions">
              <button #primary type="button" class="primary" (click)="close()">Continue</button>
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
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly primary = viewChild<ElementRef<HTMLButtonElement>>('primary');

  protected readonly mode = signal<PromptMode>('hidden');

  constructor() {
    // Browser-only: reads localStorage and push capabilities. Never runs while pre-rendering.
    afterNextRender(() => void this.decide());
  }

  private async decide(): Promise<void> {
    if (!this.isBrowser || !shouldOffer()) return;

    if (this.push.needsHomeScreen) {
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
