import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BLOG_POSTS } from '../../core/data/blog.data';
import { STORE } from '../../core/data/store.data';
import { SeoService, absoluteUrl } from '../../core/seo/seo.service';
import { SiteFooter } from '../../shared/site-footer';
import { SiteHeader } from '../../shared/site-header';

@Component({
  selector: 'app-blog',
  imports: [RouterLink, DatePipe, SiteHeader, SiteFooter],
  templateUrl: './blog.html',
  styleUrl: './blog.scss',
})
export class BlogPage implements OnInit {
  private readonly seo = inject(SeoService);
  protected readonly posts = BLOG_POSTS;

  ngOnInit(): void {
    this.seo.set({
      title: "Pizza Blog – Mountain Mike's Pizza San Jose",
      description:
        "Pizza ideas, party tips and local favorites from Mountain Mike's Pizza on Monterey Road in San Jose.",
      path: '/blog',
      image: BLOG_POSTS[0]?.image,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'Blog',
          name: `${STORE.name} Blog`,
          url: absoluteUrl('/blog'),
          blogPost: BLOG_POSTS.map((post) => ({
            '@type': 'BlogPosting',
            headline: post.title,
            url: absoluteUrl(`/blog/${post.slug}`),
            datePublished: post.date,
          })),
        },
      ],
    });
  }
}
