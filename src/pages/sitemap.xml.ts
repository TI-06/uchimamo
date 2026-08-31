import type { APIRoute } from 'astro';
import productsJson from '../data/products.json';
import cacheJson from '../data/rakuten-cache.json';
import { guides } from '../data/guides';
import { securityLandings } from '../data/security-landings';
import { seoArticles } from '../data/seo-articles';
import type { Product } from '../types/product';
import { absoluteUrl, normalizeSiteUrl } from '../lib/seo';

export const prerender = true;

type SitemapEntry = { path: string; lastmod?: string };

const staticPaths = [
  '/',
  '/diagnosis/',
  '/products/',
  '/compare/',
  '/security/',
  '/guide/',
  '/learn/',
  '/about/',
  '/affiliate-policy/',
  '/privacy/',
  '/contact/'
];

export const GET: APIRoute = () => {
  const base = normalizeSiteUrl(import.meta.env.PUBLIC_SITE_URL || 'https://uchimamo.pages.dev');
  const cache = cacheJson as Record<string, { fetchedAt?: string }>;
  const entries: SitemapEntry[] = [
    ...staticPaths.map((path) => ({ path })),
    ...securityLandings.map((landing) => ({ path: `/security/${landing.slug}/`, lastmod: landing.updatedAt })),
    ...seoArticles.map((article) => ({ path: `/learn/${article.slug}/`, lastmod: article.updatedAt })),
    ...(productsJson as Product[]).map((product) => ({
      path: `/products/${product.id}/`,
      lastmod: cache[product.id]?.fetchedAt?.slice(0, 10)
    })),
    ...guides.map((guide) => ({ path: `/guide/${guide.slug}/`, lastmod: '2026-08-19' }))
  ];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries
    .map(({ path, lastmod }) => `  <url><loc>${absoluteUrl(base, path)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</url>`)
    .join('\n')}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
