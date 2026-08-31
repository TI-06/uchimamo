import type { Product } from '../types/product';
import type { RakutenCacheItem } from './rakuten';

interface ProductStructuredDataInput {
  product: Product;
  rakuten?: RakutenCacheItem;
  baseUrl: string;
  canonicalUrl: string;
}

type JsonLdNode = Record<string, unknown>;

export function buildProductStructuredData({ product, rakuten, baseUrl, canonicalUrl }: ProductStructuredDataInput) {
  const productNode: JsonLdNode = {
    '@type': 'Product',
    '@id': `${canonicalUrl}#product`,
    name: product.name,
    description: product.description,
    sku: product.id,
    url: canonicalUrl,
    brand: {
      '@type': 'Brand',
      name: product.brand
    },
    category: product.category
  };

  if (rakuten?.imageUrl) {
    productNode.image = [rakuten.imageUrl];
  }

  if (rakuten?.price && rakuten.price > 0) {
    productNode.offers = {
      '@type': 'Offer',
      priceCurrency: 'JPY',
      price: String(rakuten.price),
      url: rakuten.affiliateUrl || rakuten.itemUrl || canonicalUrl,
      ...(rakuten.shopName ? { seller: { '@type': 'Organization', name: rakuten.shopName } } : {})
    };
  }

  if (
    rakuten?.reviewAverage != null &&
    rakuten.reviewAverage > 0 &&
    rakuten.reviewCount != null &&
    rakuten.reviewCount > 0
  ) {
    productNode.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: rakuten.reviewAverage,
      ratingCount: rakuten.reviewCount,
      bestRating: 5,
      worstRating: 1
    };
  }

  const breadcrumbNode: JsonLdNode = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'TOP',
        item: `${baseUrl}/`
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '防犯用品を探す',
        item: `${baseUrl}/products/`
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.name,
        item: canonicalUrl
      }
    ]
  };

  return {
    '@context': 'https://schema.org',
    '@graph': [productNode, breadcrumbNode]
  };
}
