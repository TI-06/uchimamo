import { describe, expect, it } from 'vitest';
import { buildRakutenRequest, normalizeRakutenItem } from './rakuten';

describe('buildRakutenRequest', () => {
  it('認証情報とaffiliateIdをURLに含める', () => {
    const url = new URL(buildRakutenRequest({
      appId: 'app-id', accessKey: 'secret-key', affiliateId: 'affiliate-id', keyword: '防犯カメラ'
    }));
    expect(url.searchParams.get('applicationId')).toBe('app-id');
    expect(url.searchParams.get('accessKey')).toBe('secret-key');
    expect(url.searchParams.get('affiliateId')).toBe('affiliate-id');
    expect(url.searchParams.get('keyword')).toBe('防犯カメラ');
  });
});

describe('normalizeRakutenItem', () => {
  it('楽天レスポンスから表示用キャッシュへ変換する', () => {
    const normalized = normalizeRakutenItem({
      itemCode: 'shop:123', itemName: 'テスト防犯カメラ', itemPrice: 19800,
      affiliateUrl: 'https://example.com/affiliate', itemUrl: 'https://example.com/item',
      reviewAverage: 4.5, reviewCount: 120, shopName: 'テスト店', mediumImageUrls: [{ imageUrl: 'https://example.com/image.jpg' }]
    });
    expect(normalized).toEqual(expect.objectContaining({
      itemCode: 'shop:123', name: 'テスト防犯カメラ', price: 19800, reviewAverage: 4.5, reviewCount: 120
    }));
    expect(normalized.imageUrl).toBe('https://example.com/image.jpg');
  });
});
