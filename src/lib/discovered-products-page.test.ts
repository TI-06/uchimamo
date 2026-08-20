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
  it('商品一覧に自動発掘カタログを別セクションで表示する', () => {
    expect(pageSource).toContain('discovered-products.json');
    expect(pageSource).toContain('新着・自動発掘');
    expect(pageSource).toContain('詳細仕様は確認中');
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
