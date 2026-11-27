import { RenderMode, ServerRoute } from '@angular/ssr';

import { BLOG_POSTS } from './core/data/blog.data';

/**
 * Public marketing pages are pre-rendered to static HTML at build time so search engines
 * get full content. Pages that depend on the visitor's browser (localStorage, sign-in,
 * push notifications) stay client-rendered.
 */
export const serverRoutes: ServerRoute[] = [
  { path: 'home', renderMode: RenderMode.Prerender },
  { path: 'blog', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'sms-terms', renderMode: RenderMode.Prerender },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => BLOG_POSTS.map((post) => ({ slug: post.slug })),
  },
  { path: '**', renderMode: RenderMode.Client },
];
