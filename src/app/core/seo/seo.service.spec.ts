import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';

import { STORE } from '../data/store.data';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let seo: SeoService;
  let doc: Document;

  beforeEach(() => {
    seo = TestBed.inject(SeoService);
    doc = TestBed.inject(DOCUMENT);
  });

  it('sets title, description, canonical and share tags from the page path', () => {
    seo.set({ title: 'Test page', description: 'About the test page', path: '/blog/test' });

    expect(doc.title).toBe('Test page');
    expect(doc.querySelector('meta[name="description"]')?.getAttribute('content')).toBe('About the test page');
    expect(doc.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${STORE.siteUrl}/blog/test`);
    expect(doc.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(`${STORE.siteUrl}/blog/test`);
    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute('content')).toMatch(/^https:\/\//);
  });

  it('replaces JSON-LD between pages and escapes "<"', () => {
    seo.set({ title: 'A', description: 'a', path: '/a', jsonLd: [{ name: '</script><b>' }] });
    seo.set({ title: 'B', description: 'b', path: '/b', jsonLd: [{ name: 'second' }] });

    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    expect(scripts.length).toBe(1);
    expect(scripts[0].textContent).toContain('second');

    seo.set({ title: 'C', description: 'c', path: '/c', jsonLd: [{ name: '</script>' }] });
    expect(doc.querySelector('script[type="application/ld+json"]')?.textContent).not.toContain('</script>');
  });

  it('marks pages noindex when asked', () => {
    seo.set({ title: 'Missing', description: 'x', path: '/x', noindex: true });
    expect(doc.querySelector('meta[name="robots"]')?.getAttribute('content')).toContain('noindex');
  });
});
