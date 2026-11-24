import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { STORE } from '../data/store.data';

export interface PageSeo {
  title: string;
  description: string;
  /** Path starting with `/`, e.g. `/blog/my-post`. */
  path: string;
  /** Path under public/ (`menu/x.jpg`) or absolute URL. */
  image?: string;
  type?: 'website' | 'article';
  /** schema.org objects to emit as JSON-LD. */
  jsonLd?: object[];
  noindex?: boolean;
}

const DEFAULT_IMAGE = 'menu/the-everest.jpg';
const JSON_LD_ID = 'page-jsonld';

/** Sets per-page title, description, canonical URL, share-preview tags and JSON-LD. Works during pre-rendering. */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  set(page: PageSeo): void {
    const url = absoluteUrl(page.path);
    const image = absoluteUrl(page.image ?? DEFAULT_IMAGE);

    this.title.setTitle(page.title);
    this.setName('description', page.description);
    this.setName('robots', page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');

    this.setProperty('og:type', page.type ?? 'website');
    this.setProperty('og:site_name', STORE.name);
    this.setProperty('og:locale', 'en_US');
    this.setProperty('og:title', page.title);
    this.setProperty('og:description', page.description);
    this.setProperty('og:url', url);
    this.setProperty('og:image', image);
    this.setName('twitter:card', 'summary_large_image');
    this.setName('twitter:title', page.title);
    this.setName('twitter:description', page.description);
    this.setName('twitter:image', image);

    this.setCanonical(url);
    this.setJsonLd(page.jsonLd ?? []);
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content }, `name="${name}"`);
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content }, `property="${property}"`);
  }

  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }

  private setJsonLd(items: object[]): void {
    const head = this.document.head;
    head.querySelector(`script#${JSON_LD_ID}`)?.remove();
    if (!items.length) return;

    const script = this.document.createElement('script');
    script.id = JSON_LD_ID;
    script.setAttribute('type', 'application/ld+json');
    // Escape `<` so content can never close the script tag.
    script.textContent = JSON.stringify(items.length === 1 ? items[0] : items).replace(/</g, '\\u003c');
    head.appendChild(script);
  }
}

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${STORE.siteUrl}/${pathOrUrl.replace(/^\/+/, '')}`;
}

/** schema.org description of the store, used on the home page and as the publisher of blog posts. */
export function restaurantJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': `${STORE.siteUrl}/#restaurant`,
    name: STORE.name,
    url: `${STORE.siteUrl}/home`,
    image: absoluteUrl(DEFAULT_IMAGE),
    telephone: STORE.phoneE164,
    servesCuisine: 'Pizza',
    hasMenu: `${STORE.siteUrl}/home#menu`,
    acceptsReservations: false,
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE.streetAddress,
      addressLocality: STORE.city,
      addressRegion: STORE.region,
      postalCode: STORE.postalCode,
      addressCountry: 'US',
    },
    potentialAction: {
      '@type': 'OrderAction',
      target: STORE.orderUrl,
    },
  };
}
