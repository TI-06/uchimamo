import { describe, expect, it } from 'vitest';
import { buildPublicDiscovered, matchesCuratedModel, mergeCandidatePool } from './discover-rakuten.mjs';

const published = {
  itemCode: 'shop:1001',
  name: 'SwitchBot 防犯カメラ',
  shopName: 'SwitchBot公式店',
  shopCode: 'shop',
  itemUrl: 'https://example.com/item',
  affiliateUrl: 'https://example.com/affiliate',
  imageUrl: 'https://example.com/image.jpg',
  price: 12800,
  reviewAverage: 4.5,
  reviewCount: 50,
  genreId: 1,
  category: 'camera',
  detectedBrand: 'SwitchBot',
  sourceKeyword: '防犯カメラ 屋外',
  qualityScore: 95,
  status: 'published',
  reasons: [],
  discoveredAt: '2026-08-19T00:00:00.000Z',
  lastSeenAt: '2026-08-19T00:00:00.000Z'
};

describe('candidate persistence', () => {
  it('同じitemCodeは重複せずdiscoveredAtを維持してlastSeenAtを更新する', () => {
    const merged = mergeCandidatePool([published], [{ ...published, price: 11800 }], '2026-08-20T00:00:00.000Z');
    expect(merged).toHaveLength(1);
    expect(merged[0].discoveredAt).toBe('2026-08-19T00:00:00.000Z');
    expect(merged[0].lastSeenAt).toBe('2026-08-20T00:00:00.000Z');
    expect(merged[0].price).toBe(11800);
  });

  it('APIが0件でも既存published候補を消さない', () => {
    const merged = mergeCandidatePool([published], [], '2026-08-20T00:00:00.000Z');
    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe('published');
  });
});

describe('curated duplicate detection', () => {
  const curated = [
    { id: 'tapo-c425', brand: 'TP-Link Tapo', category: 'camera', rakuten: { modelTokens: ['Tapo', 'C425'] } },
    { id: 'switchbot-ultra', brand: 'SwitchBot', category: 'smart-lock', rakuten: { modelTokens: ['SwitchBot', 'ロックUltra'] } }
  ];

  it('別ショップでも既存モデルと同じなら重複扱いにする', () => {
    expect(matchesCuratedModel('Tapo C425 防犯カメラ 屋外', 'camera', curated)).toBe(true);
    expect(matchesCuratedModel('SwitchBot ロックUltra 顔認証パッドセット', 'smart-lock', curated)).toBe(true);
  });

  it('別モデルは重複扱いにしない', () => {
    expect(matchesCuratedModel('Tapo C530WS 防犯カメラ', 'camera', curated)).toBe(false);
  });
});

describe('public discovered catalog', () => {
  it('publishedだけを公開し未確認スペックや独自scoreを含めない', () => {
    const rows = buildPublicDiscovered([
      published,
      { ...published, itemCode: 'shop:2', status: 'candidate' },
      { ...published, itemCode: 'shop:3', status: 'rejected' }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(expect.objectContaining({ itemCode: 'shop:1001', category: 'camera', brand: 'SwitchBot' }));
    expect(rows[0]).not.toHaveProperty('installation');
    expect(rows[0]).not.toHaveProperty('connectivity');
    expect(rows[0]).not.toHaveProperty('power');
    expect(rows[0]).not.toHaveProperty('score');
    expect(rows[0]).not.toHaveProperty('qualityScore');
  });
});
