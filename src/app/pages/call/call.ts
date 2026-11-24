import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { STORE } from '../../core/data/store.data';
import { SeoService } from '../../core/seo/seo.service';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

/**
 * Opened from a notification's "Call us" button (or tap). Browsers do not let a notification dial
 * directly, so this page tries to start the call once (`?auto=1`) and always shows a big Call button.
 */
@Component({
  selector: 'app-call',
  imports: [SiteHeader, SiteFooter],
  template: `
    <app-site-header />
    <main class="call-page">
      <p class="eyebrow">Call to order</p>
      <h1>Call {{ store.shortName }}</h1>
      <a class="call-button" data-testid="call-button" [href]="store.phoneHref">📞 Call {{ store.phoneDisplay }}</a>
      <p class="hint">Ask about today's deals, party orders and catering.</p>
      <a class="order-button" [href]="store.orderUrl" target="_blank" rel="noopener">Or order online</a>
      <address>{{ store.address }}</address>
    </main>
    <app-site-footer />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      background: #fff5d7;
    }
    .call-page {
      display: grid;
      gap: 14px;
      justify-items: center;
      width: min(100%, 520px);
      margin: 0 auto;
      padding: 48px 16px;
      text-align: center;
    }
    .eyebrow {
      margin: 0;
      color: #b2292e;
      font-size: 0.8rem;
      font-weight: 850;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    h1 {
      margin: 0;
      color: #004438;
      font-size: clamp(1.8rem, 8vw, 2.6rem);
      line-height: 1.1;
    }
    .call-button {
      display: block;
      width: 100%;
      margin-top: 8px;
      padding: 20px 16px;
      border-radius: 12px;
      background: #b2292e;
      color: #fff;
      font-size: 1.35rem;
      font-weight: 900;
      text-decoration: none;
      box-shadow: 0 14px 30px rgba(178, 41, 46, 0.3);
    }
    .hint {
      margin: 0;
      color: #594c46;
    }
    .order-button {
      padding: 12px 18px;
      border-radius: 10px;
      background: #f5d93f;
      color: #004438;
      font-weight: 850;
      text-decoration: none;
    }
    address {
      color: #594c46;
      font-style: normal;
    }
  `,
})
export class CallPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly store = STORE;

  ngOnInit(): void {
    this.seo.set({
      title: `Call ${STORE.shortName} – ${STORE.phoneDisplay}`,
      description: `Call Mountain Mike's Pizza on Monterey Road, San Jose at ${STORE.phoneDisplay} for deals, party orders and catering.`,
      path: '/call',
    });

    if (this.isBrowser && this.route.snapshot.queryParamMap.get('auto') === '1') {
      dial(STORE.phoneHref);
    }
  }
}

/** Separate so tests can replace it; opens the phone dialer. */
export function dial(href: string): void {
  window.location.href = href;
}
