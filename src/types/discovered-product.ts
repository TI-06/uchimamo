import type { ProductCategory } from './product';

export interface DiscoveredProduct {
  id: string;
  source: 'discovered';
  itemCode: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  imageUrl: string;
  affiliateUrl: string;
  itemUrl: string;
  reviewAverage: number;
  reviewCount: number;
  shopName: string;
  shopCode: string;
  discoveredAt: string;
  lastSeenAt: string;
}
