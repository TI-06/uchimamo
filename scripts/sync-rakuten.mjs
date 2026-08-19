import { readFile, writeFile } from 'node:fs/promises';

const ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701';
const PRODUCT_PATH = new URL('../src/data/products.json', import.meta.url);
const CACHE_PATH = new URL('../src/data/rakuten-cache.json', import.meta.url);

const { RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY, RAKUTEN_AFFILIATE_ID } = process.env;
if (!RAKUTEN_APP_ID || !RAKUTEN_ACCESS_KEY) {
  console.error('RAKUTEN_APP_ID と RAKUTEN_ACCESS_KEY を設定してください。');
  process.exit(1);
}

const products = JSON.parse(await readFile(PRODUCT_PATH, 'utf8'));
let cache = {};
try {
  cache = JSON.parse(await readFile(CACHE_PATH, 'utf8'));
} catch {
  cache = {};
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const unwrap = (row) => row?.Item ?? row?.item ?? row;

function candidateScore(itemName, product) {
  if (!itemName) return 0;
  if (product.rakuten.itemCode) return 1;
  const tokens = `${product.brand} ${product.name}`
    .split(/[\s・]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !['候補', '楽天市場から照合'].includes(token));
  if (tokens.length === 0) return 0.5;
  return tokens.filter((token) => itemName.toLowerCase().includes(token.toLowerCase())).length / tokens.length;
}

for (const [index, product] of products.entries()) {
  if (!product.rakuten?.enabled) continue;
  const url = new URL(ENDPOINT);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatVersion', '2');
  url.searchParams.set('applicationId', RAKUTEN_APP_ID);
  url.searchParams.set('affiliateId', RAKUTEN_AFFILIATE_ID ?? '');
  url.searchParams.set('keyword', product.rakuten.keyword);
  url.searchParams.set('hits', '5');
  if (product.rakuten.itemCode) url.searchParams.set('itemCode', product.rakuten.itemCode);

  try {
    const response = await fetch(url, { headers: { accessKey: RAKUTEN_ACCESS_KEY } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const rows = Array.isArray(data.items) ? data.items.map(unwrap) : [];
    const ranked = rows
      .map((item) => ({ item, score: candidateScore(item?.itemName ?? '', product) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];
    if (!best || best.score < 0.35) {
      console.warn(`[skip] ${product.id}: 一致度の高い商品が見つかりませんでした`);
    } else {
      const item = best.item;
      cache[product.id] = {
        itemCode: item.itemCode ?? '',
        name: item.itemName ?? product.name,
        price: Number(item.itemPrice ?? 0),
        affiliateUrl: item.affiliateUrl ?? item.itemUrl ?? '',
        itemUrl: item.itemUrl ?? '',
        reviewAverage: item.reviewAverage == null ? null : Number(item.reviewAverage),
        reviewCount: item.reviewCount == null ? null : Number(item.reviewCount),
        shopName: item.shopName ?? '',
        imageUrl: item.mediumImageUrls?.[0]?.imageUrl ?? item.smallImageUrls?.[0]?.imageUrl ?? '',
        fetchedAt: new Date().toISOString()
      };
      console.log(`[ok] ${product.id}: ${cache[product.id].name}`);
    }
  } catch (error) {
    console.warn(`[keep-cache] ${product.id}: ${error instanceof Error ? error.message : error}`);
  }

  if (index < products.length - 1) await sleep(1100);
}

await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
console.log(`楽天キャッシュを更新しました: ${Object.keys(cache).length}件`);
