import type { APIRoute } from 'astro';
import productsJson from '../data/products.json';
import type { Product } from '../types/product';
import { absoluteUrl, normalizeSiteUrl } from '../lib/seo';

export const prerender = true;

const staticPaths = [
  '/',
  '/diagnosis/',
  '/products/',
  '/compare/',
  '/guide/',
  '/about/',
  '/affiliate-policy/',
  '/privacy/',
  '/contact/'
];

export const GET: APIRoute = () => {
  const base = normalizeSiteUrl(import.meta.env.PUBLIC_SITE_URL || 'https://uchimamo.pages.dev');
  const productPaths = (productsJson as Product[]).map((product) => `/products/${product.id}/`);
  const urls = [...staticPaths, ...productPaths];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((path) => `  <url><loc>${absoluteUrl(base, path)}</loc></url>`)
    .join('\n')}\n</urlset>\n`;

  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' }
  });
};
