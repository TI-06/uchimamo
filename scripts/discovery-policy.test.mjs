import { describe, expect, it } from 'vitest';
import { detectBrand, evaluateCandidate, extractModelIdentity, scoreCandidate } from './discovery-policy.mjs';

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
  it.each(['2台セット', '中古', '交換用', 'サイクル'])('%sを含む商品はrejectする', (token) => {
    const result = evaluateCandidate({ ...baseItem, itemName: `SwitchBot 防犯カメラ ${token}` }, cameraRule);
    expect(result.status).toBe('rejected');
    expect(result.reasons.join(' ')).toContain(token);
  });

  it('カテゴリ固有の除外語に一致した商品をrejectする', () => {
    const sensorRule = { category: 'sensor', requiredAny: ['人感センサー'], excludeAny: ['ライト', '照明'] };
    const result = evaluateCandidate({ ...baseItem, itemName: 'ムサシ 人感センサーライト 防犯', shopName: 'ムサシ公式' }, sensorRule);
    expect(result.status).toBe('rejected');
    expect(result.reasons).toContain('category-excluded:ライト');
  });

  it('trusted brandを商品名から検出する', () => {
    expect(detectBrand('SwitchBot ロックUltra', '')).toBe('SwitchBot');
    expect(detectBrand('Tapo C425 防犯カメラ', '')).toBe('Tapo');
  });

  it('製品型番を抽出しIP等の仕様値は型番扱いしない', () => {
    expect(extractModelIdentity('Tapo C530WS 防犯カメラ IP66 4MP')).toBe('C530WS');
    expect(extractModelIdentity('Tapo 防犯カメラ IP66 4MP 2K')).toBe('');
  });

  it('ブランド不明商品は自動公開しない', () => {
    const result = evaluateCandidate({ ...baseItem, itemName: '無名メーカー C900 防犯カメラ', shopName: '無名ショップ' }, cameraRule);
    expect(result.status).toBe('candidate');
    expect(result.reasons).toContain('trusted-brand-required');
    expect(result.coreEligible).toBe(false);
  });

  it('型番不明の汎用商品ページはレビューが高くても自動公開しない', () => {
    const result = evaluateCandidate({
      ...baseItem,
      itemName: 'TP-Link Tapo 防犯カメラ 屋外 360° 2K 4MP IP66',
      shopName: 'TP-Linkダイレクト 楽天市場店',
      reviewAverage: 4.8,
      reviewCount: 2000
    }, cameraRule);
    expect(result.status).toBe('candidate');
    expect(result.reasons).toContain('model-identity-required');
    expect(result.coreEligible).toBe(false);
  });

  it('型番あり・レビュー0件でも新商品ルートのコア条件を満たす', () => {
    const result = evaluateCandidate({
      ...baseItem,
      itemName: 'Tapo C530WS 防犯カメラ 屋外',
      shopName: 'TP-Linkダイレクト',
      reviewAverage: 0,
      reviewCount: 0
    }, cameraRule);
    expect(result.status).toBe('candidate');
    expect(result.coreEligible).toBe(true);
    expect(result.reasons).toContain('review-average-below-4.0');
    expect(result.reasons).toContain('review-count-below-10');
  });

  it('型番あり・4.0点・10レビュー・trusted brand・必須語一致なら人気商品ルートを満たす', () => {
    const result = evaluateCandidate({ ...baseItem, itemName: 'Tapo C530WS 防犯カメラ 屋外', shopName: 'TP-Linkダイレクト' }, cameraRule);
    expect(result.qualityScore).toBeGreaterThanOrEqual(80);
    expect(result.status).toBe('published');
    expect(result.coreEligible).toBe(true);
    expect(result.publicationRoute).toBe('popular');
  });

  it('affiliateRateは品質スコアへ影響しない', () => {
    const low = scoreCandidate({ ...baseItem, affiliateRate: 1 }, cameraRule);
    const high = scoreCandidate({ ...baseItem, affiliateRate: 99 }, cameraRule);
    expect(low).toBe(high);
  });
});
