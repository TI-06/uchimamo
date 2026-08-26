import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const pagePath = fileURLToPath(new URL('../pages/products/index.astro', import.meta.url));
const cardPath = fileURLToPath(new URL('../components/DiscoveredProductCard.astro', import.meta.url));
const typePath = fileURLToPath(new URL('../types/discovered-product.ts', import.meta.url));
const pageSource = readFileSync(pagePath, 'utf8');
const cardSource = readFileSync(cardPath, 'utf8');
const typeSource = readFileSync(typePath, 'utf8');

describe('auto-discovered product UI', () => {
  it('自動発掘商品をメイン商品件数と一覧へ統合する', () => {
    expect(pageSource).toContain('discovered-products.json');
    expect(pageSource).toContain('const totalProducts = products.length + discovered.length');
    expect(pageSource).toContain('{totalProducts}商品');
    expect(pageSource).toContain('id="resultCount">{totalProducts}');
    expect(pageSource).toContain('<DiscoveredProductCard product={product} />');
    expect(pageSource).not.toContain('<section class="discovered-section">');
  });

  it('カテゴリ絞り込みでは自動発掘品も対象にし、詳細条件指定時だけ除外する', () => {
    expect(cardSource).toContain('data-discovered-card');
    expect(cardSource).toContain('data-category={product.category}');
    expect(pageSource).toContain("document.querySelectorAll('[data-product-card], [data-discovered-card]')");
    expect(pageSource).toContain('const detailedFilterActive');
    expect(pageSource).toContain("node.hasAttribute('data-discovered-card')");
    expect(pageSource).toContain('仕様確認前の商品は詳細条件検索から除外');
  });

  it('新商品ルートと人気商品ルートを表示上で区別する', () => {
    expect(typeSource).toContain("publicationRoute: 'new' | 'popular'");
    expect(cardSource).toContain('レビュー蓄積中');
    expect(cardSource).toContain('人気商品');
  });

  it('自動発掘カードは独自評価や比較機能を持たない', () => {
    expect(cardSource).toContain('楽天で詳細を見る');
    expect(cardSource).not.toContain('ウチマモ評価');
    expect(cardSource).not.toContain('比較に追加');
    expect(cardSource).not.toContain('data-compare-checkbox');
    expect(cardSource).not.toContain('data-product-card');
  });
});
