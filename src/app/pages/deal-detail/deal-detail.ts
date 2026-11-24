import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { STORE } from '../../core/data/store.data';
import { Deal } from '../../core/models/deal.model';
import { SeoService } from '../../core/seo/seo.service';
import { DealService } from '../../core/services/deal.service';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

type Status = 'loading' | 'ready' | 'ended' | 'error';

/** One deal, opened from a push notification or a link. Falls back to the deals list if it has ended. */
@Component({
  selector: 'app-deal-detail',
  imports: [RouterLink, SiteHeader, SiteFooter],
  template: `
    <app-site-header />
    <main class="deal-page">
      <a class="back-link" routerLink="/deals">← All deals</a>

      @switch (status()) {
        @case ('loading') {
          <p class="status-card">Loading deal…</p>
        }
        @case ('ready') {
          @if (deal(); as deal) {
            <article class="deal-card" data-testid="deal-detail">
              @if (deal.promo_code) {
                <span class="deal-tag">Code {{ deal.promo_code }}</span>
              }
              <h1>{{ deal.title }}</h1>
              @if (deal.description) {
                <p class="description">{{ deal.description }}</p>
              }
              <div class="price-row">
                @if (deal.original_price !== null) {
                  <span class="original-price">{{ formatPrice(deal.original_price) }}</span>
                }
                <strong>{{ formatPrice(deal.discounted_price) }}</strong>
              </div>
              @if (deal.promo_code) {
                <p class="how">Use code <strong>{{ deal.promo_code }}</strong> when you order or mention it when you call.</p>
              }
              <div class="actions">
                <a class="btn btn-order" data-testid="deal-order" [href]="store.orderUrl" target="_blank" rel="noopener">Order online</a>
                <a class="btn btn-call" data-testid="deal-call" [href]="store.phoneHref">Call {{ store.phoneDisplay }}</a>
              </div>
            </article>
          }
        }
        @case ('ended') {
          <section class="status-card" data-testid="deal-ended">
            <h1>This deal has ended</h1>
            <p>Check out what's on today.</p>
            <a class="btn btn-order" routerLink="/deals">See today's deals</a>
          </section>
        }
        @case ('error') {
          <section class="status-card">
            <h1>We couldn't load this deal</h1>
            <p>Please try again, or call us at <a [href]="store.phoneHref">{{ store.phoneDisplay }}</a>.</p>
            <a class="btn btn-order" routerLink="/deals">See today's deals</a>
          </section>
        }
      }
    </main>
    <app-site-footer />
  `,
  styles: `
    :host {
      display: block;
      min-height: 100dvh;
      background: #fff5d7;
      color: #1f1814;
    }
    .deal-page {
      width: min(100%, 640px);
      margin: 0 auto;
      padding: 24px 16px 48px;
    }
    .back-link {
      color: #b2292e;
      font-weight: 850;
      text-decoration: none;
    }
    .deal-card,
    .status-card {
      display: grid;
      gap: 12px;
      margin-top: 16px;
      padding: 22px 18px;
      border-top: 6px solid #b2292e;
      border-radius: 10px;
      background: #fff;
      box-shadow: 0 14px 34px rgba(0, 0, 0, 0.1);
    }
    h1 {
      margin: 0;
      color: #004438;
      font-size: clamp(1.6rem, 6vw, 2.2rem);
      line-height: 1.15;
    }
    p {
      margin: 0;
      color: #594c46;
      line-height: 1.5;
    }
    .description {
      font-size: 1.05rem;
    }
    .deal-tag {
      width: fit-content;
      border-radius: 8px;
      background: #f5d93f;
      color: #004438;
      padding: 6px 8px;
      font-size: 0.78rem;
      font-weight: 850;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .price-row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: baseline;
    }
    .price-row strong {
      color: #b2292e;
      font-size: 2rem;
    }
    .original-price {
      color: #7b6b63;
      font-weight: 800;
      text-decoration: line-through;
    }
    .actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 6px;
    }
    .btn {
      display: block;
      padding: 13px 12px;
      border-radius: 10px;
      font-weight: 850;
      text-align: center;
      text-decoration: none;
    }
    .btn-order {
      background: #f5d93f;
      color: #004438;
    }
    .btn-call {
      background: #b2292e;
      color: #fff;
    }
    @media (max-width: 380px) {
      .actions {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class DealDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly dealService = inject(DealService);
  private readonly seo = inject(SeoService);
  private readonly currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  protected readonly store = STORE;
  protected readonly deal = signal<Deal | null>(null);
  protected readonly status = signal<Status>('loading');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.seo.set({
      title: `Pizza deal – ${STORE.shortName}`,
      description: `Today's pizza deal at Mountain Mike's Pizza, ${STORE.address}.`,
      path: `/deals/${id}`,
      noindex: true, // deals expire; keep them out of search results
    });
    void this.load(id);
  }

  protected formatPrice(value: number): string {
    return this.currency.format(value);
  }

  private async load(id: string): Promise<void> {
    try {
      const deal = await this.dealService.getDeal(id);
      if (!deal || !deal.active) {
        this.status.set('ended');
        return;
      }
      this.deal.set(deal);
      this.status.set('ready');
      this.seo.set({
        title: `${deal.title} – ${STORE.shortName}`,
        description: deal.description || `Pizza deal at ${STORE.name}.`,
        path: `/deals/${id}`,
        noindex: true,
      });
    } catch {
      this.status.set('error');
    }
  }
}
