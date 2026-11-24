import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BLOG_POSTS } from '../../core/data/blog.data';
import { BlogPage } from './blog';

describe('BlogPage', () => {
  it('lists every imported post with a link to it', async () => {
    await TestBed.configureTestingModule({
      imports: [BlogPage],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(BlogPage);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;

    const cards = el.querySelectorAll<HTMLAnchorElement>('[data-testid="blog-card"]');
    expect(BLOG_POSTS.length).toBeGreaterThan(0);
    expect(cards.length).toBe(BLOG_POSTS.length);
    cards.forEach((card, i) => {
      expect(card.getAttribute('href')).toBe(`/blog/${BLOG_POSTS[i].slug}`);
      expect(card.querySelector('h2')?.textContent?.trim()).toBe(BLOG_POSTS[i].title);
    });
  });
});
