import { describe, expect, it } from 'vitest';
import { diagnoseSecurity } from './diagnosis';
import type { Product } from '../types/product';

const products: Product[] = [
  {
    id: 'camera-parking', name: '駐車場カメラ', brand: 'Demo', category: 'camera', description: '', score: 90,
    installation: { noDrilling: true, diy: true, outdoor: true, indoor: false },
    connectivity: { wifiRequired: true, lteSupported: false },
    power: { ac: false, battery: true, solar: true },
    storage: { sd: true, cloud: true, local: false }, monthlyFeeRequired: false,
    features: [], targetUsers: ['戸建て'], places: ['parking'], rakuten: { enabled: true, keyword: '防犯カメラ' }
  },
  {
    id: 'lock-entrance', name: '玄関ロック', brand: 'Demo', category: 'smart-lock', description: '', score: 95,
    installation: { noDrilling: true, diy: true, outdoor: false, indoor: true },
    connectivity: { wifiRequired: false, lteSupported: false },
    power: { ac: false, battery: true, solar: false }, monthlyFeeRequired: false,
    features: [], targetUsers: ['戸建て'], places: ['entrance'], rakuten: { enabled: true, keyword: 'スマートロック' }
  }
];

describe('diagnoseSecurity', () => {
  it('戸建て玄関・穴あけ不可では玄関向け工事不要商品を優先する', () => {
    const result = diagnoseSecurity({
      residence: 'house', place: 'entrance', power: 'available', wifi: 'available', drilling: 'no', budget: 30000
    }, products);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.recommendedProductIds[0]).toBe('lock-entrance');
    expect(result.priorities.length).toBeGreaterThan(0);
  });

  it('Wi-FiなしではWi-Fi必須商品を減点する', () => {
    const result = diagnoseSecurity({
      residence: 'house', place: 'parking', power: 'none', wifi: 'none', drilling: 'no', budget: 30000
    }, products);
    expect(result.recommendedProductIds[0]).not.toBe('camera-parking');
  });
});
