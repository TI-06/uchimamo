export interface RakutenRequestInput {
  appId: string;
  accessKey: string;
  affiliateId?: string;
  keyword?: string;
  itemCode?: string;
  referer?: string;
}

export interface RakutenRequest {
  url: string;
  headers: { accessKey: string; Referer?: string; Origin?: string };
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
  url.searchParams.set('hits', '3');
  if (input.affiliateId) url.searchParams.set('affiliateId', input.affiliateId);
  if (input.itemCode) url.searchParams.set('itemCode', input.itemCode);
  else if (input.keyword) url.searchParams.set('keyword', input.keyword);

  let origin: string | undefined;
  if (input.referer) {
    try {
      origin = new URL(input.referer).origin;
    } catch {
      origin = undefined;
    }
  }

  return {
    url: url.toString(),
    headers: {
      accessKey: input.accessKey,
      ...(input.referer ? { Referer: input.referer } : {}),
      ...(origin ? { Origin: origin } : {})
    }
  };
}

export function extractRakutenItems(data: Record<string, unknown>): Record<string, unknown>[] {
  const raw = Array.isArray(data.Items) ? data.Items : Array.isArray(data.items) ? data.items : [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return undefined;
      const record = row as Record<string, unknown>;
      const nested = record.Item ?? record.item;
      return nested && typeof nested === 'object' ? nested as Record<string, unknown> : record;
    })
    .filter((row): row is Record<string, unknown> => Boolean(row));
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
