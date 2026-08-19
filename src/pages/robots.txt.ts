import type { APIRoute } from 'astro';
import { normalizeSiteUrl } from '../lib/seo';

export const prerender = true;

export const GET: APIRoute = () => {
  const base = normalizeSiteUrl(import.meta.env.PUBLIC_SITE_URL || 'https://uchimamo.pages.dev');
  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${base}/sitemap.xml\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
