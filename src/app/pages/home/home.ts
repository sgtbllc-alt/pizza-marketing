import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, PLATFORM_ID, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MENU_CATEGORIES, MENU_ITEMS, MenuItem, menuImage, menuSlug } from '../../core/data/menu.data';
import { BLOG_POSTS } from '../../core/data/blog.data';
import { STORE } from '../../core/data/store.data';
import { SeoService, restaurantJsonLd } from '../../core/seo/seo.service';
import { DealService } from '../../core/services/deal.service';
import { PushPrompt } from '../../shared/push-prompt';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

@Component({
  selector: 'app-home',
  imports: [RouterLink, SiteHeader, SiteFooter, PushPrompt],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomePage implements OnInit {
  private readonly dealService = inject(DealService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly seo = inject(SeoService);

  protected readonly store = STORE;
  protected readonly sections = MENU_CATEGORIES.map((category) => ({
    ...category,
    items: MENU_ITEMS.filter((item) => item.category === category.id),
  }));
  protected readonly latestPosts = BLOG_POSTS.slice(0, 3);

  protected readonly promoText = signal<string>(STORE.promoFallback);
  private readonly missingImages = signal<ReadonlySet<string>>(new Set());

  ngOnInit(): void {
    this.seo.set({
      title: "Pizza in San Jose – Mountain Mike's Pizza, 4116 Monterey Road",
      description:
        "Mountain Mike's Pizza on Monterey Road, San Jose: specialty and classic pizzas, Tikka Masala pizza, party and catering specials. Order online or call 408-622-4755.",
      path: '/home',
      jsonLd: [restaurantJsonLd()],
    });

    // The deal banner is live data: fetch it in the browser only, never while pre-rendering.
    if (isPlatformBrowser(this.platformId)) {
      void this.loadPromo();
    }
  }

  protected slug(item: MenuItem): string {
    return menuSlug(item.name);
  }

  protected imageSrc(item: MenuItem): string {
    return menuImage(item);
  }

  protected hasImage(item: MenuItem): boolean {
    return !this.missingImages().has(this.slug(item));
  }

  protected onImageError(item: MenuItem): void {
    const next = new Set(this.missingImages());
    next.add(this.slug(item));
    this.missingImages.set(next);
  }

  private async loadPromo(): Promise<void> {
    try {
      const deals = await this.dealService.getActiveDeals();
      const title = deals[0]?.title?.trim();
      this.promoText.set(title || STORE.promoFallback);
    } catch {
      this.promoText.set(STORE.promoFallback);
    }
  }
}
