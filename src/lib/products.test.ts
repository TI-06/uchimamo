import { describe, expect, it } from 'vitest';
import { compareProducts, filterProducts } from './products';
import type { Product } from '../types/product';

const products: Product[] = [
  {
    id: 'cam-solar',
    name: 'ソーラーカメラ',
    brand: 'Demo',
    category: 'camera',
    description: '屋外向け',
    score: 92,
    installation: { noDrilling: true, diy: true, outdoor: true, indoor: false },
    connectivity: { wifiRequired: true, lteSupported: false },
    power: { ac: false, battery: true, solar: true },
    storage: { sd: true, cloud: true, local: false },
    monthlyFeeRequired: false,
    features: ['人物検知'],
    targetUsers: ['戸建て'],
    places: ['parking'],
    rakuten: { enabled: true, keyword: 'ソーラー 防犯カメラ' }
  },
  {
    id: 'lock-smart',
    name: 'スマートロック',
    brand: 'Demo',
    category: 'smart-lock',
    description: '玄関向け',
    score: 88,
    installation: { noDrilling: true, diy: true, outdoor: false, indoor: true },
    connectivity: { wifiRequired: false, lteSupported: false },
    power: { ac: false, battery: true, solar: false },
    monthlyFeeRequired: false,
    features: ['指紋認証'],
    targetUsers: ['賃貸'],
    places: ['entrance'],
    rakuten: { enabled: true, keyword: 'スマートロック' }
  },
  {
    id: 'cam-ac',
    name: 'ACカメラ',
    brand: 'Demo',
    category: 'camera',
    description: '常時給電向け',
    score: 80,
    installation: { noDrilling: false, diy: true, outdoor: true, indoor: false },
    connectivity: { wifiRequired: true, lteSupported: false },
    power: { ac: true, battery: false, solar: false },
    storage: { sd: true, cloud: false, local: true },
    monthlyFeeRequired: false,
    features: [],
    targetUsers: ['戸建て'],
    places: ['parking'],
    rakuten: { enabled: false, keyword: '' }
  }
];

describe('filterProducts', () => {
  it('工事不要かつソーラーの商品だけを返す', () => {
    const result = filterProducts(products, { noDrilling: true, solar: true });
    expect(result.map((item) => item.id)).toEqual(['cam-solar']);
  });

  it('電源不要ではバッテリーまたはソーラー駆動の商品だけを返す', () => {
    const result = filterProducts(products, { powerNotRequired: true });
    expect(result.map((item) => item.id)).toEqual(['cam-solar', 'lock-smart']);
  });
});

describe('compareProducts', () => {
  it('指定順を維持して最大3商品を返す', () => {
    const result = compareProducts(products, ['lock-smart', 'cam-solar', 'missing', 'extra']);
    expect(result.map((item) => item.id)).toEqual(['lock-smart', 'cam-solar']);
  });
});
