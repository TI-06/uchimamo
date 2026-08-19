import { describe, expect, it } from 'vitest';
import { buildRakutenRequest, normalizeRakutenItem } from './rakuten';

describe('buildRakutenRequest', () => {
  it('App IDとaffiliateIdはURL、Access KeyとRefererはヘッダーへ分離する', () => {
    const request = buildRakutenRequest({
      appId: 'app-id',
      accessKey: 'secret-key',
      affiliateId: 'affiliate-id',
      keyword: '防犯カメラ',
      referer: 'https://uchimamo.pages.dev/'
    });
    const url = new URL(request.url);
    expect(url.searchParams.get('applicationId')).toBe('app-id');
    expect(url.searchParams.get('affiliateId')).toBe('affiliate-id');
    expect(url.searchParams.get('keyword')).toBe('防犯カメラ');
    expect(url.searchParams.get('accessKey')).toBeNull();
    expect(request.headers.accessKey).toBe('secret-key');
    expect(request.headers.Referer).toBe('https://uchimamo.pages.dev/');
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

  it('2026-07-01 APIの画像URL文字列配列を扱える', () => {
    const normalized = normalizeRakutenItem({
      itemCode: 'shop:456', itemName: '現行API商品', itemPrice: 12800,
      mediumImageUrls: ['https://example.com/current-image.jpg']
    });
    expect(normalized.imageUrl).toBe('https://example.com/current-image.jpg');
  });
});
