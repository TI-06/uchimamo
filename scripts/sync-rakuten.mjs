import { readFile, writeFile } from 'node:fs/promises';

const ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701';
const PRODUCT_PATH = new URL('../src/data/products.json', import.meta.url);
const CACHE_PATH = new URL('../src/data/rakuten-cache.json', import.meta.url);
const STATUS_PATH = new URL('../src/data/rakuten-sync-status.json', import.meta.url);

const { RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY, RAKUTEN_AFFILIATE_ID } = process.env;
if (!RAKUTEN_APP_ID || !RAKUTEN_ACCESS_KEY || !RAKUTEN_AFFILIATE_ID) {
  console.error('RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY / RAKUTEN_AFFILIATE_ID を設定してください。');
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
const firstImageUrl = (list) => {
  const first = Array.isArray(list) ? list[0] : undefined;
  if (typeof first === 'string') return first;
  return first?.imageUrl ?? '';
};

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

async function responseError(response) {
  let detail = '';
  try {
    const text = await response.text();
    try {
      const json = JSON.parse(text);
      detail = json.error_description || json.error || text;
    } catch {
      detail = text;
    }
  } catch {
    detail = '';
  }
  return `HTTP ${response.status}${detail ? `: ${String(detail).slice(0, 300)}` : ''}`;
}

let enabledCount = 0;
let successCount = 0;
let skippedCount = 0;
let failureCount = 0;
const errors = [];
const skipped = [];

for (const [index, product] of products.entries()) {
  if (!product.rakuten?.enabled) continue;
  enabledCount += 1;

  const url = new URL(ENDPOINT);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatVersion', '2');
  url.searchParams.set('applicationId', RAKUTEN_APP_ID);
  url.searchParams.set('affiliateId', RAKUTEN_AFFILIATE_ID);
  url.searchParams.set('keyword', product.rakuten.keyword);
  url.searchParams.set('hits', '5');
  if (product.rakuten.itemCode) url.searchParams.set('itemCode', product.rakuten.itemCode);

  try {
    const response = await fetch(url, { headers: { accessKey: RAKUTEN_ACCESS_KEY } });
    if (!response.ok) throw new Error(await responseError(response));

    const data = await response.json();
    const rows = Array.isArray(data.items) ? data.items.map(unwrap) : [];
    const ranked = rows
      .map((item) => ({ item, score: candidateScore(item?.itemName ?? '', product) }))
      .sort((a, b) => b.score - a.score);
    const best = ranked[0];

    if (!best || best.score < 0.35) {
      skippedCount += 1;
      skipped.push(product.id);
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
        imageUrl: firstImageUrl(item.mediumImageUrls) || firstImageUrl(item.smallImageUrls),
        fetchedAt: new Date().toISOString()
      };
      successCount += 1;
      console.log(`[ok] ${product.id}: ${cache[product.id].name}`);
    }
  } catch (error) {
    failureCount += 1;
    const message = error instanceof Error ? error.message : String(error);
    errors.push({ productId: product.id, message: message.slice(0, 300) });
    console.error(`[error] ${product.id}: ${message}`);
  }

  if (index < products.length - 1) await sleep(1100);
}

const ok = enabledCount === 0 || successCount > 0;
const status = {
  ok,
  checkedAt: new Date().toISOString(),
  endpointVersion: '2026-07-01',
  enabledCount,
  successCount,
  skippedCount,
  failureCount,
  skipped,
  errors
};

await writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
console.log(`楽天同期サマリー: enabled=${enabledCount}, success=${successCount}, skip=${skippedCount}, error=${failureCount}`);

if (!ok) {
  console.error('楽天同期に成功した商品が0件です。rakuten-sync-status.json のエラー内容を確認してください。');
  process.exit(1);
}

await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
console.log(`楽天キャッシュを更新しました: ${Object.keys(cache).length}件`);
