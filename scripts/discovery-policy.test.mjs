import { describe, expect, it } from 'vitest';
import { detectBrand, evaluateCandidate, scoreCandidate } from './discovery-policy.mjs';

const cameraRule = {
  category: 'camera',
  requiredAny: ['防犯カメラ', '監視カメラ'],
};

const baseItem = {
  itemCode: 'trusted:1001',
  itemName: 'SwitchBot 防犯カメラ 屋外モデル',
  shopName: 'SwitchBot公式店',
  shopCode: 'trusted',
  itemPrice: 12800,
  affiliateUrl: 'https://example.com/affiliate',
  itemUrl: 'https://example.com/item',
  mediumImageUrls: ['https://example.com/image.jpg'],
  availability: 1,
  reviewAverage: 4.0,
  reviewCount: 10,
};

describe('discovery policy', () => {
  it.each(['2台セット', '中古', '交換用'])('%sを含む商品はrejectする', (token) => {
    const result = evaluateCandidate({ ...baseItem, itemName: `SwitchBot 防犯カメラ ${token}` }, cameraRule);
    expect(result.status).toBe('rejected');
    expect(result.reasons.join(' ')).toContain(token);
  });

  it('trusted brandを商品名から検出する', () => {
    expect(detectBrand('SwitchBot ロックUltra', '')).toBe('SwitchBot');
    expect(detectBrand('Tapo C425 防犯カメラ', '')).toBe('Tapo');
  });

  it('ブランド不明商品は自動公開しない', () => {
    const result = evaluateCandidate({ ...baseItem, itemName: '無名メーカー 防犯カメラ' }, cameraRule);
    expect(result.status).toBe('candidate');
    expect(result.reasons).toContain('trusted-brand-required');
  });

  it('4.0点・10レビュー・trusted brand・必須語一致なら公開基準を満たす', () => {
    const result = evaluateCandidate(baseItem, cameraRule);
    expect(result.qualityScore).toBeGreaterThanOrEqual(80);
    expect(result.status).toBe('published');
  });

  it('affiliateRateは品質スコアへ影響しない', () => {
    const low = scoreCandidate({ ...baseItem, affiliateRate: 1 }, cameraRule);
    const high = scoreCandidate({ ...baseItem, affiliateRate: 99 }, cameraRule);
    expect(low).toBe(high);
  });
});
