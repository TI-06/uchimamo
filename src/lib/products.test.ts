import { describe, expect, it } from 'vitest';
import { compareProducts, filterProducts } from './products';
import productsJson from '../data/products.json';
import extraProductsJson from '../data/products-extra.json';
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

describe('launch product catalog', () => {
  const catalog = [...productsJson, ...extraProductsJson] as Product[];

  it('30商品を5カテゴリで提供する', () => {
    expect(catalog).toHaveLength(30);
    const counts = catalog.reduce<Record<string, number>>((acc, product) => {
      acc[product.category] = (acc[product.category] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({ camera: 10, 'smart-lock': 7, sensor: 5, light: 4, 'window-lock': 4 });
  });

  it('楽天連携商品は固定itemCodeまたは厳格modelTokensを持つ', () => {
    const enabled = catalog.filter((product) => product.rakuten.enabled);
    expect(enabled).toHaveLength(30);
    expect(enabled.every((product) => Boolean(product.rakuten.itemCode) || Boolean(product.rakuten.modelTokens?.length))).toBe(true);
  });

  it('レビュー済み6商品の固定itemCodeを維持する', () => {
    const expected = new Map([
      ['switchbot-lock-ultra', 'switchbot:10000315'],
      ['switchbot-lock-pro', 'switchbot:10000121'],
      ['tapo-outdoor-battery-camera', 'tplinkdirect:10001237'],
      ['outdoor-lte-camera', 'shop-amanotori:10030960'],
      ['window-sensor', 'arkham:10001427'],
      ['sensor-light-solar', 'suparee:10000239']
    ]);
    for (const [id, itemCode] of expected) {
      expect(catalog.find((product) => product.id === id)?.rakuten.itemCode).toBe(itemCode);
    }
  });

  it('商品IDは重複しない', () => {
    expect(new Set(catalog.map((product) => product.id)).size).toBe(catalog.length);
  });
});
