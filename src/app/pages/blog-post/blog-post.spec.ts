import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { BLOG_POSTS } from '../../core/data/blog.data';
import { BlogPostPage } from './blog-post';

async function render(slug: string): Promise<HTMLElement> {
  await TestBed.configureTestingModule({
    imports: [BlogPostPage],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ slug })) } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(BlogPostPage);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('BlogPostPage', () => {
  it('renders the post title and body for a known slug', async () => {
    const post = BLOG_POSTS[0];
    const el = await render(post.slug);

    expect(el.querySelector('h1')?.textContent?.trim()).toBe(post.title);
    const body = el.querySelector('[data-testid="post-content"]');
    expect(body?.textContent?.trim().length).toBeGreaterThan(200);
    expect(body?.querySelector('script')).toBeNull();
  });

  it('shows "Post not found" for an unknown slug', async () => {
    const el = await render('no-such-post');
    expect(el.querySelector('h1')?.textContent?.trim()).toBe('Post not found');
  });
});
