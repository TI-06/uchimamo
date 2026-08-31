import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const productSchemaPath = fileURLToPath(new URL('./product-structured-data.ts', import.meta.url));
const articlesPath = fileURLToPath(new URL('../data/seo-articles.ts', import.meta.url));
const learnIndexPath = fileURLToPath(new URL('../pages/learn/index.astro', import.meta.url));
const learnDetailPath = fileURLToPath(new URL('../pages/learn/[slug].astro', import.meta.url));
const layoutPath = fileURLToPath(new URL('../layouts/BaseLayout.astro', import.meta.url));
const sitemapPath = fileURLToPath(new URL('../pages/sitemap.xml.ts', import.meta.url));
const homePath = fileURLToPath(new URL('../pages/index.astro', import.meta.url));
const packagePath = fileURLToPath(new URL('../../package.json', import.meta.url));

describe('SEO v0.3.0', () => {
  it('商品詳細用のProduct/Breadcrumb構造化データを生成し、外部サイトの評価は集計しない', async () => {
    expect(existsSync(productSchemaPath)).toBe(true);
    if (!existsSync(productSchemaPath)) return;

    const { buildProductStructuredData } = await import('./product-structured-data');
    const schema = buildProductStructuredData({
      product: {
        id: 'camera-1',
        name: 'テスト防犯カメラ',
        brand: 'TEST',
        category: 'camera',
        description: 'テスト商品',
        score: 90,
        installation: { noDrilling: true, diy: true, outdoor: true, indoor: false },
        connectivity: { wifiRequired: true, lteSupported: false },
        power: { ac: false, battery: true, solar: false },
        monthlyFeeRequired: false,
        features: ['屋外'],
        targetUsers: ['戸建て'],
        places: ['parking'],
        rakuten: { enabled: true, keyword: 'test' }
      },
      rakuten: {
        itemCode: 'shop:item',
        name: 'テスト防犯カメラ',
        price: 12800,
        affiliateUrl: 'https://example.com/item',
        reviewAverage: 4.5,
        reviewCount: 20,
        shopName: 'テスト店',
        imageUrl: 'https://example.com/image.jpg',
        fetchedAt: '2026-08-31T00:00:00.000Z'
      },
      baseUrl: 'https://uchimamo.pages.dev',
      canonicalUrl: 'https://uchimamo.pages.dev/products/camera-1/'
    });

    expect(schema['@context']).toBe('https://schema.org');
    expect(schema['@graph'][0]['@type']).toBe('Product');
    expect(schema['@graph'][0].offers.priceCurrency).toBe('JPY');
    expect(schema['@graph'][0].offers.price).toBe('12800');
    expect(schema['@graph'][0].aggregateRating).toBeUndefined();
    expect(schema['@graph'][1]['@type']).toBe('BreadcrumbList');
  });

  it('新しい検索流入向け記事を10本以上持つ', async () => {
    expect(existsSync(articlesPath)).toBe(true);
    if (!existsSync(articlesPath)) return;

    const { seoArticles } = await import('../data/seo-articles');
    expect(seoArticles.length).toBeGreaterThanOrEqual(10);
    expect(new Set(seoArticles.map((article) => article.slug)).size).toBe(seoArticles.length);
    expect(seoArticles.every((article) => article.sections.length >= 4)).toBe(true);
    expect(seoArticles.every((article) => article.source?.url?.startsWith('https://'))).toBe(true);
  });

  it('記事一覧・詳細ルートとサイト内導線を持つ', () => {
    expect(existsSync(learnIndexPath)).toBe(true);
    expect(existsSync(learnDetailPath)).toBe(true);
    expect(readFileSync(homePath, 'utf8')).toContain('href="/learn/"');
  });

  it('共通レイアウトで商品構造化データを出力し、sitemapへ記事を含める', () => {
    const layoutSource = readFileSync(layoutPath, 'utf8');
    const sitemapSource = readFileSync(sitemapPath, 'utf8');
    expect(layoutSource).toContain('buildProductStructuredData');
    expect(layoutSource).toContain('productStructuredData');
    expect(sitemapSource).toContain('seoArticles');
    expect(sitemapSource).toContain("'/learn/'");
  });

  it('package versionを0.3.0へ上げる', () => {
    const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
    expect(pkg.version).toBe('0.3.0');
  });
});
