import type { Product, ProductFilters } from '../types/product';

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  return products
    .filter((product) => !filters.category || product.category === filters.category)
    .filter((product) => !filters.place || product.places.includes(filters.place))
    .filter((product) => filters.noDrilling !== true || product.installation.noDrilling)
    .filter((product) => filters.wifiNotRequired !== true || !product.connectivity.wifiRequired)
    .filter((product) => filters.powerNotRequired !== true || product.power.battery || product.power.solar)
    .filter((product) => filters.battery !== true || product.power.battery)
    .filter((product) => filters.solar !== true || product.power.solar)
    .filter((product) => filters.monthlyFeeFree !== true || !product.monthlyFeeRequired)
    .filter((product) => filters.outdoor !== true || product.installation.outdoor)
    .sort((a, b) => b.score - a.score);
}

export function compareProducts(products: Product[], ids: string[]): Product[] {
  const byId = new Map(products.map((product) => [product.id, product]));
  return ids.slice(0, 3).map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
}

export function getProductById(products: Product[], id: string): Product | undefined {
  return products.find((product) => product.id === id);
}
