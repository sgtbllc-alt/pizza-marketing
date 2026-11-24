import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import { BLOG_CONTENT } from '../../core/data/blog-content.data';
import { BLOG_POSTS } from '../../core/data/blog.data';
import { STORE } from '../../core/data/store.data';
import { SeoService, absoluteUrl, restaurantJsonLd } from '../../core/seo/seo.service';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

@Component({
  selector: 'app-blog-post',
  imports: [RouterLink, DatePipe, SiteHeader, SiteFooter],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss',
})
export class BlogPostPage {
  private readonly route = inject(ActivatedRoute);
  private readonly seo = inject(SeoService);

  protected readonly store = STORE;
  protected readonly slug = toSignal(this.route.paramMap.pipe(map((p) => p.get('slug') ?? '')), {
    initialValue: '',
  });
  protected readonly post = computed(() => BLOG_POSTS.find((p) => p.slug === this.slug()));
  protected readonly content = computed(() => {
    const html = BLOG_CONTENT[this.slug()] ?? '';
    const title = this.post()?.title;
    // Most imported posts open with an <h2> repeating the title; the page already shows it as <h1>.
    const lead = /^\s*<h2>(.*?)<\/h2>\s*/s.exec(html);
    return lead && title && plainText(lead[1]) === plainText(title) ? html.slice(lead[0].length) : html;
  });
  protected readonly morePosts = computed(() =>
    BLOG_POSTS.filter((p) => p.slug !== this.slug()).slice(0, 3),
  );

  constructor() {
    effect(() => {
      const post = this.post();
      if (!post) {
        this.seo.set({
          title: "Post not found – Mountain Mike's Pizza San Jose",
          description: 'This blog post could not be found.',
          path: `/blog/${this.slug()}`,
          noindex: true,
        });
        return;
      }
      const path = `/blog/${post.slug}`;
      this.seo.set({
        title: `${post.title} | Mountain Mike's Pizza San Jose`,
        description: summary(this.content()) || post.excerpt,
        path,
        image: post.image,
        type: 'article',
        jsonLd: [
          {
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.date,
            mainEntityOfPage: absoluteUrl(path),
            ...(post.image ? { image: absoluteUrl(post.image) } : {}),
            author: { '@type': 'Organization', name: STORE.name },
            publisher: restaurantJsonLd(),
          },
        ],
      });
    });
  }
}

/** First paragraph as plain text, cut to ~155 characters for the meta description. */
function summary(html: string): string {
  const first = /<p>(.*?)<\/p>/s.exec(html)?.[1] ?? '';
  const text = first
    .replace(/<[^>]+>/g, '')
    .replace(/&#8217;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length <= 155 ? text : `${text.slice(0, 152).replace(/\s+\S*$/, '')}…`;
}

function plainText(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/&#8217;|’/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
