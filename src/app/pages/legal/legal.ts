import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { STORE } from '../../core/data/store.data';
import { SeoService } from '../../core/seo/seo.service';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

export type LegalDoc = 'privacy' | 'sms-terms';

/** Privacy Policy and SMS Terms. Required by carriers (A2P 10DLC / toll-free verification) for text programs. */
@Component({
  selector: 'app-legal',
  imports: [RouterLink, SiteHeader, SiteFooter],
  template: `
    <app-site-header />
    <main class="legal-page">
      @if (doc === 'sms-terms') {
        <h1>SMS Terms &amp; Conditions</h1>
        <p class="updated">Last updated: {{ updated }}</p>

        <h2>Program</h2>
        <p>{{ store.name }} ({{ store.address }}) sends recurring text messages with pizza deals, specials,
          giveaway and prize-entry updates, and store news to customers who sign up.</p>

        <h2>How you join</h2>
        <p>You join by entering your mobile number on our sign-up page at
          <a routerLink="/">{{ siteHost }}</a> and checking the box agreeing to receive texts. The box is optional
          and is never checked for you. <strong>Consent is not a condition of any purchase.</strong></p>

        <h2>Message frequency and cost</h2>
        <p>Message frequency varies. Message and data rates may apply, according to your mobile plan.</p>

        <h2>How to stop</h2>
        <p>Reply <strong>STOP</strong> to any message to cancel. You will get one final message confirming you are
          unsubscribed and no more texts after that. To join again, sign up again on our website.</p>

        <h2>Help</h2>
        <p>Reply <strong>HELP</strong> to any message, or call us at
          <a [href]="store.phoneHref">{{ store.phoneDisplay }}</a>.</p>

        <h2>Carriers</h2>
        <p>Carriers are not liable for delayed or undelivered messages.</p>

        <h2>Privacy</h2>
        <p>See our <a routerLink="/privacy">Privacy Policy</a>. We do not sell or share your mobile number or
          text-message consent with third parties or affiliates for their marketing.</p>
      } @else {
        <h1>Privacy Policy</h1>
        <p class="updated">Last updated: {{ updated }}</p>

        <p>This policy explains what {{ store.name }} ({{ store.address }}) collects through
          {{ siteHost }} and how we use it.</p>

        <h2>What we collect</h2>
        <ul>
          <li><strong>Sign-up details:</strong> your name and mobile phone number, and whether you agreed to receive texts.</li>
          <li><strong>Orders and prize entries:</strong> order totals and dates linked to your phone number, so we can
            count giveaway entries and rewards.</li>
          <li><strong>Notifications:</strong> if you turn on push notifications, a browser subscription that lets us
            send them to your device.</li>
          <li><strong>Basic technical data:</strong> information your browser sends when you visit, such as device type.</li>
        </ul>

        <h2>How we use it</h2>
        <ul>
          <li>To send the deals, giveaway updates and store news you asked for.</li>
          <li>To track prize entries and rewards, and to contact winners.</li>
          <li>To run and improve this website.</li>
        </ul>

        <h2>Text messages</h2>
        <p>We send marketing texts only if you checked the consent box. Reply STOP to cancel or HELP for help.
          See our <a routerLink="/sms-terms">SMS Terms</a>.</p>
        <p><strong>No mobile information will be shared with third parties or affiliates for marketing or
          promotional purposes.</strong> Text-messaging opt-in data and consent are not shared with any third
          parties. We use service providers (for example, our text-message and hosting providers) only to deliver
          our own messages and run this site.</p>

        <h2>We don't sell your information</h2>
        <p>We do not sell or rent your personal information.</p>

        <h2>Your choices</h2>
        <ul>
          <li>Reply STOP to any text to stop messages.</li>
          <li>Turn off push notifications in your browser or device settings.</li>
          <li>Ask us to see or delete your information by calling
            <a [href]="store.phoneHref">{{ store.phoneDisplay }}</a> or visiting the store.</li>
        </ul>

        <h2>Contact</h2>
        <p>{{ store.name }}, {{ store.address }} ·
          <a [href]="store.phoneHref">{{ store.phoneDisplay }}</a></p>
      }
    </main>
    <app-site-footer />
  `,
  styles: `
    .legal-page {
      width: min(100% - 32px, 760px);
      margin: 0 auto;
      padding: 32px 0 48px;
      color: #2d2522;
      line-height: 1.6;
    }
    h1 { color: #004438; margin-bottom: 4px; }
    h2 { color: #004438; font-size: 1.1rem; margin: 24px 0 6px; }
    .updated { color: #6a5d57; font-size: 0.9rem; margin-top: 0; }
    a { color: #b2292e; font-weight: 700; }
    ul { padding-left: 20px; }
  `,
})
export class LegalPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  protected readonly store = STORE;
  protected readonly updated = 'November 27, 2026';
  protected readonly siteHost = new URL(STORE.siteUrl).host;
  protected readonly doc: LegalDoc = this.route.snapshot.data['doc'] ?? 'privacy';

  ngOnInit(): void {
    this.seo.set(
      this.doc === 'sms-terms'
        ? {
            title: "SMS Terms – Mountain Mike's Pizza San Jose",
            description: "Terms for text-message deals from Mountain Mike's Pizza, 4116 Monterey Road, San Jose. Reply STOP to cancel, HELP for help.",
            path: '/sms-terms',
          }
        : {
            title: "Privacy Policy – Mountain Mike's Pizza San Jose",
            description: "How Mountain Mike's Pizza on Monterey Road, San Jose collects and uses your information.",
            path: '/privacy',
          },
    );
  }
}
