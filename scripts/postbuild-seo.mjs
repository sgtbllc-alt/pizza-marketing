// Runs after `npm run build` (npm "postbuild" hook). Adds the files a static host needs for SEO:
//   index.html / 404.html  – app shell for client-rendered routes (GitHub Pages serves 404.html for unknown paths)
//   robots.txt, sitemap.xml
//   <old-wordpress-path>/index.html – redirect pages so old links and search results land on the new pages
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist/pizza-marketing');
const browser = join(dist, 'browser');

const store = readFileSync(join(root, 'src/app/core/data/store.data.ts'), 'utf8');
const SITE = store.match(/siteUrl:\s*'([^']+)'/)[1].replace(/\/$/, '');

// 1. App shell for client-rendered routes ('/', '/deals', '/admin…').
const shell = join(browser, 'index.csr.html');
if (!existsSync(join(browser, 'index.html'))) copyFileSync(shell, join(browser, 'index.html'));
copyFileSync(shell, join(browser, '404.html'));
// Client-rendered routes get their own copy so GitHub Pages answers 200 instead of 404.
const clientRoutes = ['deals', 'call', 'notifications', 'admin', 'admin-login', 'admin/add-order', 'admin/deals', 'admin/customers', 'admin/send-deal', 'admin/send-push'];
for (const route of clientRoutes) {
  const file = join(browser, route, 'index.html');
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true });
    copyFileSync(shell, file);
  }
}

// 2. Sitemap: client-rendered public pages + every pre-rendered page.
const prerendered = Object.keys(JSON.parse(readFileSync(join(dist, 'prerendered-routes.json'), 'utf8')).routes);
const blogData = readFileSync(join(root, 'src/app/core/data/blog.data.ts'), 'utf8');
const postDates = Object.fromEntries(
  [...blogData.matchAll(/"slug":\s*"([^"]+)",[\s\S]*?"date":\s*"([^"]+)"/g)].map((m) => [`/blog/${m[1]}`, m[2]]),
);
const today = new Date().toISOString().slice(0, 10);
const pages = [...new Set(['/', '/home', '/deals', '/blog', ...prerendered])];
const priority = (p) => (p === '/home' ? '1.0' : p === '/' || p === '/blog' ? '0.8' : p.startsWith('/blog/') ? '0.6' : '0.7');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${SITE}${p === '/' ? '/' : `${p}/`}</loc>
    <lastmod>${postDates[p] ?? today}</lastmod>
    <priority>${priority(p)}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;
writeFileSync(join(browser, 'sitemap.xml'), sitemap);

// 3. robots.txt
writeFileSync(
  join(browser, 'robots.txt'),
  `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin-login

Sitemap: ${SITE}/sitemap.xml
`,
);

// 4. Redirect pages for old WordPress addresses.
const legacy = {
  ...JSON.parse(readFileSync(join(root, 'src/app/core/data/legacy-redirects.json'), 'utf8')),
  ...Object.fromEntries(Object.keys(postDates).map((p) => [p.replace('/blog/', ''), p])),
};
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
let redirects = 0;
for (const [from, to] of Object.entries(legacy)) {
  const file = join(browser, from, 'index.html');
  if (existsSync(file)) continue; // never overwrite a real page
  mkdirSync(dirname(file), { recursive: true });
  const target = `${SITE}${to}/`;
  writeFileSync(
    file,
    `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Moved</title>
<link rel="canonical" href="${esc(target)}">
<meta name="robots" content="noindex, follow">
<meta http-equiv="refresh" content="0; url=${esc(to)}">
<script>location.replace(${JSON.stringify(to)});</script>
</head>
<body><p>This page has moved to <a href="${esc(to)}">${esc(target)}</a>.</p></body>
</html>
`,
  );
  redirects++;
}

console.log(`postbuild-seo: ${pages.length} sitemap URLs, ${redirects} legacy redirects, site ${SITE}`);
