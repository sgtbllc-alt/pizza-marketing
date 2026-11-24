import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';

import { STORE } from '../../core/data/store.data';
import { SeoService } from '../../core/seo/seo.service';
import { PushStatusService } from '../../core/services/push-status.service';
import { PushOptIn } from '../../shared/push-opt-in';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

/** Opened from the green tick in the header: shows when this device turned notifications on. */
@Component({
  selector: 'app-notifications',
  imports: [DatePipe, SiteHeader, SiteFooter, PushOptIn],
  template: `
    <app-site-header />
    <main class="status-page">
      <h1>Notification status</h1>

      @if (push.enabledAt(); as enabledAt) {
        <section class="status-card on" data-testid="push-status-on">
          <span class="tick" aria-hidden="true">✓</span>
          <div>
            <p class="state">Notifications are on for this device</p>
            <p>Turned on <strong data-testid="push-enabled-date">{{ enabledAt | date: 'EEEE, MMMM d, y' }}</strong>
              at {{ enabledAt | date: 'h:mm a' }}</p>
            @if (deviceCode) {
              <p class="code">Device code: <strong>{{ deviceCode }}</strong></p>
            }
          </div>
        </section>
      } @else {
        <section class="status-card off" data-testid="push-status-off">
          <span class="tick" aria-hidden="true">!</span>
          <div>
            <p class="state">Notifications are off on this device</p>
            <p>Turn them on below to get {{ store.shortName }} deals first.</p>
          </div>
        </section>
      }

      <app-push-opt-in />
    </main>
    <app-site-footer />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      background: #fff5d7;
    }
    .status-page {
      width: min(100%, 720px);
      margin: 0 auto;
      padding: 32px 16px 24px;
    }
    h1 {
      margin: 0 0 16px;
      color: #004438;
      font-size: clamp(1.8rem, 7vw, 2.4rem);
    }
    .status-card {
      display: flex;
      gap: 14px;
      align-items: flex-start;
      margin: 0 16px;
      padding: 18px;
      border-radius: 12px;
      background: #fff;
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
    }
    .status-card p {
      margin: 0 0 6px;
      color: #4f433e;
      line-height: 1.45;
    }
    .state {
      color: #1f1814 !important;
      font-size: 1.1rem;
      font-weight: 850;
    }
    .code {
      font-size: 0.9rem;
    }
    .tick {
      flex: none;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      color: #fff;
      font-size: 1.3rem;
      font-weight: 900;
    }
    .on .tick {
      background: #2fb36d;
    }
    .off .tick {
      background: #b2292e;
    }
  `,
})
export class NotificationsPage implements OnInit {
  protected readonly push = inject(PushStatusService);
  private readonly seo = inject(SeoService);
  protected readonly store = STORE;
  protected deviceCode: string | null = null;

  ngOnInit(): void {
    this.seo.set({
      title: `Notification status – ${STORE.shortName}`,
      description: 'Check whether deal notifications are on for this device.',
      path: '/notifications',
      noindex: true,
    });
    this.push.load();
    this.deviceCode = this.push.deviceCode();
  }
}
