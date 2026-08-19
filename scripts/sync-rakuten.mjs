import { readFile, writeFile } from 'node:fs/promises';
import { candidateScore, selectRakutenCandidate } from './rakuten-match.mjs';

const ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701';
const PRODUCT_PATH = new URL('../src/data/products.json', import.meta.url);
const EXTRA_PRODUCT_PATH = new URL('../src/data/products-extra.json', import.meta.url);
const REPLACEMENT_PRODUCT_PATH = new URL('../src/data/products-replacements.json', import.meta.url);
const PINS_PATH = new URL('../src/data/products-pins.json', import.meta.url);
const CACHE_PATH = new URL('../src/data/rakuten-cache.json', import.meta.url);
const STATUS_PATH = new URL('../src/data/rakuten-sync-status.json', import.meta.url);
const RAKUTEN_REFERER = process.env.RAKUTEN_REFERER || 'https://uchimamo.pages.dev/';
const RAKUTEN_ORIGIN = new URL(RAKUTEN_REFERER).origin;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';
const DISCONTINUED_PRODUCT_IDS = new Set(['qrio-lock-q-sl2']);

const { RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY, RAKUTEN_AFFILIATE_ID } = process.env;
if (!RAKUTEN_APP_ID || !RAKUTEN_ACCESS_KEY || !RAKUTEN_AFFILIATE_ID) {
  console.error('RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY / RAKUTEN_AFFILIATE_ID を設定してください。');
  process.exit(1);
}

const pins = JSON.parse(await readFile(PINS_PATH, 'utf8'));
const applyPins = (product) => pins[product.id]
  ? { ...product, rakuten: { ...product.rakuten, ...pins[product.id] } }
  : product;
const extraProducts = JSON.parse(await readFile(EXTRA_PRODUCT_PATH, 'utf8'));
const products = [
  ...JSON.parse(await readFile(PRODUCT_PATH, 'utf8')),
  ...extraProducts.filter((product) => !DISCONTINUED_PRODUCT_IDS.has(product.id)),
  ...JSON.parse(await readFile(REPLACEMENT_PRODUCT_PATH, 'utf8'))
].map(applyPins);
let cache = {};
try {
  cache = JSON.parse(await readFile(CACHE_PATH, 'utf8'));
} catch {
  cache = {};
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const unwrap = (row) => row?.Item ?? row?.item ?? row;
const extractRows = (data) => {
  const raw = Array.isArray(data?.Items) ? data.Items : Array.isArray(data?.items) ? data.items : [];
  return raw.map(unwrap).filter(Boolean);
};
const firstImageUrl = (list) => {
  const first = Array.isArray(list) ? list[0] : undefined;
  if (typeof first === 'string') return first;
  return first?.imageUrl ?? '';
};

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
const skippedCandidates = [];
const needsReview = [];

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
    const response = await fetch(url, {
      headers: {
        accessKey: RAKUTEN_ACCESS_KEY,
        Referer: RAKUTEN_REFERER,
        Origin: RAKUTEN_ORIGIN,
        'User-Agent': USER_AGENT
      }
    });
    if (!response.ok) throw new Error(await responseError(response));

    const data = await response.json();
    const rows = extractRows(data);
    const selected = selectRakutenCandidate(rows, product);
    const fallbackRanked = rows
      .map((item) => ({ item, score: candidateScore(item?.itemName ?? '', product) }))
      .sort((a, b) => b.score - a.score);

    if (selected.needsReview) {
      skippedCount += 1;
      skipped.push(product.id);
      const reason = selected.reason ?? 'needs-review';
      needsReview.push({
        productId: product.id,
        reason,
        ...(product.rakuten.itemCode ? { expectedItemCode: product.rakuten.itemCode } : {}),
        ...(product.rakuten.modelTokens?.length ? { modelTokens: product.rakuten.modelTokens } : {})
      });
      skippedCandidates.push({
        productId: product.id,
        keyword: product.rakuten.keyword,
        ...(product.rakuten.itemCode ? { expectedItemCode: product.rakuten.itemCode } : {}),
        ...(product.rakuten.modelTokens?.length ? { modelTokens: product.rakuten.modelTokens } : {}),
        candidates: fallbackRanked.slice(0, 5).map(({ item, score }) => ({
          itemCode: String(item?.itemCode ?? ''),
          name: String(item?.itemName ?? '').slice(0, 180),
          price: Number(item?.itemPrice ?? 0),
          score: Number(score.toFixed(3))
        }))
      });
      console.warn(`[review] ${product.id}: ${reason} のため、別商品へ自動切り替えしませんでした`);
    } else if (!selected.item || selected.score < 0.3) {
      skippedCount += 1;
      skipped.push(product.id);
      skippedCandidates.push({
        productId: product.id,
        keyword: product.rakuten.keyword,
        candidates: fallbackRanked.slice(0, 5).map(({ item, score }) => ({
          itemCode: String(item?.itemCode ?? ''),
          name: String(item?.itemName ?? '').slice(0, 180),
          price: Number(item?.itemPrice ?? 0),
          score: Number(score.toFixed(3))
        }))
      });
      console.warn(`[skip] ${product.id}: 一致度の高い商品が見つかりませんでした`);
    } else {
      const item = selected.item;
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
  needsReview,
  skipped,
  skippedCandidates,
  errors
};

await writeFile(STATUS_PATH, `${JSON.stringify(status, null, 2)}\n`, 'utf8');
console.log(`楽天同期サマリー: enabled=${enabledCount}, success=${successCount}, skip=${skippedCount}, review=${needsReview.length}, error=${failureCount}`);

if (!ok) {
  console.error('楽天同期に成功した商品が0件です。rakuten-sync-status.json の候補商品を確認してください。');
  process.exit(1);
}

await writeFile(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
console.log(`楽天キャッシュを更新しました: ${Object.keys(cache).length}件`);
