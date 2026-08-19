export interface RakutenRequestInput {
  appId: string;
  accessKey: string;
  affiliateId?: string;
  keyword: string;
  itemCode?: string;
}

export interface RakutenRequest {
  url: string;
  headers: { accessKey: string };
}

export interface RakutenCacheItem {
  itemCode: string;
  name: string;
  price: number;
  affiliateUrl?: string;
  itemUrl?: string;
  reviewAverage?: number;
  reviewCount?: number;
  shopName?: string;
  imageUrl?: string;
  fetchedAt: string;
}

const ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701';

export function buildRakutenRequest(input: RakutenRequestInput): RakutenRequest {
  const url = new URL(ENDPOINT);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatVersion', '2');
  url.searchParams.set('applicationId', input.appId);
  url.searchParams.set('keyword', input.keyword);
  url.searchParams.set('hits', '3');
  if (input.affiliateId) url.searchParams.set('affiliateId', input.affiliateId);
  if (input.itemCode) url.searchParams.set('itemCode', input.itemCode);

  return {
    url: url.toString(),
    headers: { accessKey: input.accessKey }
  };
}

function imageUrlFrom(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'imageUrl' in value) {
    const imageUrl = (value as { imageUrl?: unknown }).imageUrl;
    return typeof imageUrl === 'string' ? imageUrl : undefined;
  }
  return undefined;
}

export function normalizeRakutenItem(item: Record<string, unknown>): RakutenCacheItem {
  const images = Array.isArray(item.mediumImageUrls) ? item.mediumImageUrls : [];
  return {
    itemCode: String(item.itemCode ?? ''),
    name: String(item.itemName ?? ''),
    price: Number(item.itemPrice ?? 0),
    affiliateUrl: item.affiliateUrl ? String(item.affiliateUrl) : undefined,
    itemUrl: item.itemUrl ? String(item.itemUrl) : undefined,
    reviewAverage: item.reviewAverage == null ? undefined : Number(item.reviewAverage),
    reviewCount: item.reviewCount == null ? undefined : Number(item.reviewCount),
    shopName: item.shopName ? String(item.shopName) : undefined,
    imageUrl: imageUrlFrom(images[0]),
    fetchedAt: new Date().toISOString()
  };
}
