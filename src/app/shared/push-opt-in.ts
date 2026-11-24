import { Component, OnInit, computed, inject, input } from '@angular/core';
import { STORE } from '../core/data/store.data';
import { PushStatusService } from '../core/services/push-status.service';
import { PushService } from '../core/services/push.service';
import { IosInstallSteps } from './ios-install-steps';

@Component({
  selector: 'app-push-opt-in',
  imports: [IosInstallSteps],
  template: `
    @if (!hidden()) {
    <section class="push-card" aria-label="Pizza deal notifications" data-testid="push-opt-in">
      @if (push.needsHomeScreen) {
        <h2>3 steps to a {{ reward.short }} {{ reward.emoji }}</h2>
        <p>Add us to your Home Screen and turn on deal alerts:</p>
        <app-ios-install-steps [isIPad]="isIPad" />
        <p class="terms">{{ reward.terms }} Needs iOS 16.4 or later.</p>
      } @else if (!push.supported) {
        <h2>Get pizza deal notifications</h2>
        <p>Push notifications are unavailable in this browser. Try an updated browser or open the installed app.</p>
      } @else {
        @if (push.enabled()) {
          <h2>Notifications are on</h2>
        } @else {
          <h2>One tap to a {{ reward.short }} {{ reward.emoji }}</h2>
          <p>Turn on deal notifications and your next soda is on us. Turn them off anytime.</p>
        }
        @if (push.enabled()) {
          <button type="button" (click)="push.disable()" [disabled]="push.busy()">Turn off notifications</button>
        } @else if (push.denied) {
          <p>Notifications are blocked. Allow them in your device or browser notification settings, then reopen the app.</p>
        } @else {
          <button type="button" (click)="push.enable()" [disabled]="!push.ready() || push.busy()">
            {{ push.busy() ? 'Turning on…' : 'Turn on notifications' }}
          </button>
          <p class="terms">{{ reward.terms }}</p>
        }
        @if (push.message()) { <p role="status">{{ push.message() }}</p> }
      }
    </section>
    }
  `,
  styles: [`
    :host { display:block; max-width:720px; margin:24px auto; padding:0 16px; }
    .push-card { --step-bg:#fff; padding:24px; border:1px solid #ead9c9; border-radius:18px; background:#fff8ed; color:#35271e; }
    .terms { margin:12px 0 0; color:#9a8b83; font-size:.75rem; line-height:1.35; }
    h2 { font-size:1.3rem; margin:0 0 10px; } p { line-height:1.5; }
    button { padding:12px 18px; border:0; border-radius:10px; background:#a93224; color:white; font:inherit; cursor:pointer; }
    button:disabled { opacity:.6; cursor:default; }
  `],
})
export class PushOptIn implements OnInit {
  protected readonly push = inject(PushService);
  private readonly status = inject(PushStatusService);
  protected readonly reward = STORE.pushReward;
  protected isIPad = false;
  /** Keep showing the card (with "Turn off") after notifications are on. Used on the admin send page. */
  readonly showWhenOn = input(false);
  /** Customers only see the card while it is useful: to turn notifications on. Turning off lives on /notifications. */
  protected readonly hidden = computed(() => !this.showWhenOn() && (this.push.enabled() || this.status.enabledAt() !== null));
  ngOnInit() {
    this.isIPad = /iPad/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    this.status.load();
    void this.push.initialize();
  }
}
