import { BLOG_POSTS } from './blog.data';
import STATIC_REDIRECTS from './legacy-redirects.json';

/**
 * Addresses from the old WordPress site (mountainmikesinsanjose.com) and where they live now.
 * Old post addresses were `/<slug>/`; they now live at `/blog/<slug>`.
 * scripts/postbuild-seo.mjs reads the same JSON file to write static redirect pages.
 */
export const LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  ...STATIC_REDIRECTS,
  ...Object.fromEntries(BLOG_POSTS.map((post) => [post.slug, `/blog/${post.slug}`])),
};
