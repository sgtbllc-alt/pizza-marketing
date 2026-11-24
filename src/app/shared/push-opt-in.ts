import { Component, OnInit, inject } from '@angular/core';
import { PushService } from '../core/services/push.service';

@Component({
  selector: 'app-push-opt-in',
  template: `
    <section class="push-card" aria-label="Pizza deal notifications">
      <h2>Get pizza deal notifications</h2>
      @if (push.needsHomeScreen) {
        <p>On iPhone or iPad, open this site in Safari, tap Share → Add to Home Screen, then open the new app icon to enable notifications. Requires iOS 16.4 or later.</p>
      } @else if (!push.supported) {
        <p>Push notifications are unavailable in this browser. Try an updated browser or open the installed app.</p>
      } @else {
        <p>Choose to receive pizza offers on this device. You can turn them off anytime.</p>
        @if (push.enabled()) {
          <button type="button" (click)="push.disable()" [disabled]="push.busy()">Turn off notifications</button>
        } @else if (push.denied) {
          <p>Notifications are blocked. Allow them in your device or browser notification settings, then reopen the app.</p>
        } @else {
          <button type="button" (click)="push.enable()" [disabled]="!push.ready() || push.busy()">
            {{ push.busy() ? 'Enabling…' : 'Enable notifications' }}
          </button>
        }
        @if (push.message()) { <p role="status">{{ push.message() }}</p> }
      }
    </section>
  `,
  styles: [`
    :host { display:block; max-width:720px; margin:24px auto; padding:0 16px; }
    .push-card { padding:24px; border:1px solid #ead9c9; border-radius:18px; background:#fff8ed; color:#35271e; }
    h2 { font-size:1.3rem; margin:0 0 10px; } p { line-height:1.5; }
    button { padding:12px 18px; border:0; border-radius:10px; background:#a93224; color:white; font:inherit; cursor:pointer; }
    button:disabled { opacity:.6; cursor:default; }
  `],
})
export class PushOptIn implements OnInit {
  protected readonly push = inject(PushService);
  ngOnInit() { void this.push.initialize(); }
}
