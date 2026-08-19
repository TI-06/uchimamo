import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { discoveryConfig, evaluateCandidate, firstImageUrl } from './discovery-policy.mjs';

const ENDPOINT = 'https://openapi.rakuten.co.jp/ichibams/api/IchibaItem/Search/20260701';
const CANDIDATE_PATH = new URL('../src/data/product-candidates.json', import.meta.url);
const DISCOVERED_PATH = new URL('../src/data/discovered-products.json', import.meta.url);
const CACHE_PATH = new URL('../src/data/rakuten-cache.json', import.meta.url);
const PRODUCT_PATHS = [
  new URL('../src/data/products.json', import.meta.url),
  new URL('../src/data/products-extra.json', import.meta.url),
  new URL('../src/data/products-replacements.json', import.meta.url)
];
const PINS_PATH = new URL('../src/data/products-pins.json', import.meta.url);
const RAKUTEN_REFERER = process.env.RAKUTEN_REFERER || 'https://uchimamo.pages.dev/';
const RAKUTEN_ORIGIN = new URL(RAKUTEN_REFERER).origin;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36';
const STALE_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const unwrap = (row) => row?.Item ?? row?.item ?? row;
const extractRows = (data) => {
  const raw = Array.isArray(data?.Items) ? data.Items : Array.isArray(data?.items) ? data.items : [];
  return raw.map(unwrap).filter(Boolean);
};
const readJson = async (url, fallback) => {
  try {
    return JSON.parse(await readFile(url, 'utf8'));
  } catch {
    return fallback;
  }
};
const normalizeText = (value) => String(value ?? '').normalize('NFKC').trim();
const normalizeMatch = (value) => normalizeText(value).toLowerCase().replace(/\s+/g, ' ');
const asNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
};

function makePublicId(itemCode) {
  return `rakuten-${Buffer.from(String(itemCode), 'utf8').toString('base64url').toLowerCase().slice(0, 36)}`;
}

export function matchesCuratedModel(name, category, curatedProducts) {
  const haystack = normalizeMatch(name);
  return curatedProducts.some((product) => {
    if (product?.category !== category) return false;
    const tokens = product?.rakuten?.modelTokens;
    if (!Array.isArray(tokens) || tokens.length === 0) return false;
    return tokens.every((token) => haystack.includes(normalizeMatch(token)));
  });
}

export function mergeCandidatePool(existing, incoming, nowIso = new Date().toISOString()) {
  const now = new Date(nowIso).getTime();
  const incomingCodes = new Set(incoming.map((row) => row.itemCode));
  const map = new Map(existing.map((row) => [row.itemCode, { ...row }]));

  for (const row of incoming) {
    if (!row?.itemCode) continue;
    const previous = map.get(row.itemCode);
    map.set(row.itemCode, {
      ...previous,
      ...row,
      discoveredAt: previous?.discoveredAt || row.discoveredAt || nowIso,
      lastSeenAt: nowIso
    });
  }

  for (const [itemCode, row] of map) {
    if (incomingCodes.has(itemCode)) continue;
    const lastSeen = new Date(row.lastSeenAt || row.discoveredAt || nowIso).getTime();
    if (Number.isFinite(lastSeen) && now - lastSeen >= STALE_AFTER_MS && row.status !== 'rejected') {
      map.set(itemCode, { ...row, status: 'stale', reasons: [...new Set([...(row.reasons ?? []), 'not-seen-for-14-days'])] });
    }
  }

  return [...map.values()].sort((a, b) => String(b.discoveredAt).localeCompare(String(a.discoveredAt)));
}

export function buildPublicDiscovered(candidates) {
  return candidates
    .filter((row) => row.status === 'published')
    .sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0) || String(b.discoveredAt).localeCompare(String(a.discoveredAt)))
    .map((row) => ({
      id: makePublicId(row.itemCode),
      source: 'discovered',
      itemCode: row.itemCode,
      name: row.name,
      brand: row.detectedBrand,
      category: row.category,
      price: row.price,
      imageUrl: row.imageUrl,
      affiliateUrl: row.affiliateUrl,
      itemUrl: row.itemUrl,
      reviewAverage: row.reviewAverage,
      reviewCount: row.reviewCount,
      shopName: row.shopName,
      shopCode: row.shopCode,
      discoveredAt: row.discoveredAt,
      lastSeenAt: row.lastSeenAt
    }));
}

function normalizeCandidate(item, rule, nowIso) {
  const evaluation = evaluateCandidate(item, rule);
  return {
    itemCode: normalizeText(item?.itemCode),
    name: normalizeText(item?.itemName),
    shopName: normalizeText(item?.shopName),
    shopCode: normalizeText(item?.shopCode),
    itemUrl: normalizeText(item?.itemUrl),
    affiliateUrl: normalizeText(item?.affiliateUrl),
    imageUrl: firstImageUrl(item),
    price: asNumber(item?.itemPrice),
    reviewAverage: asNumber(item?.reviewAverage),
    reviewCount: asNumber(item?.reviewCount),
    genreId: asNumber(item?.genreId),
    category: rule.category,
    detectedBrand: evaluation.detectedBrand,
    sourceKeyword: rule.keyword,
    qualityScore: evaluation.qualityScore,
    status: evaluation.status,
    reasons: evaluation.reasons,
    discoveredAt: nowIso,
    lastSeenAt: nowIso
  };
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

async function loadCuratedCatalog() {
  const itemCodes = new Set();
  const products = [];
  const cache = await readJson(CACHE_PATH, {});
  Object.values(cache).forEach((row) => { if (row?.itemCode) itemCodes.add(String(row.itemCode)); });

  const pins = await readJson(PINS_PATH, {});
  Object.values(pins).forEach((row) => { if (row?.itemCode) itemCodes.add(String(row.itemCode)); });

  for (const path of PRODUCT_PATHS) {
    const rows = await readJson(path, []);
    for (const product of rows) {
      products.push(product);
      if (product?.rakuten?.itemCode) itemCodes.add(String(product.rakuten.itemCode));
    }
  }
  return { itemCodes, products };
}

function buildSearchUrl(rule, sort, appId, affiliateId) {
  const url = new URL(ENDPOINT);
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatVersion', '2');
  url.searchParams.set('applicationId', appId);
  url.searchParams.set('affiliateId', affiliateId);
  url.searchParams.set('keyword', rule.keyword);
  url.searchParams.set('hits', '30');
  url.searchParams.set('sort', sort);
  url.searchParams.set('availability', '1');
  url.searchParams.set('imageFlag', '1');
  url.searchParams.set('field', '1');
  url.searchParams.set('purchaseType', '0');
  if (rule.minPrice) url.searchParams.set('minPrice', String(rule.minPrice));
  if (rule.maxPrice) url.searchParams.set('maxPrice', String(rule.maxPrice));
  url.searchParams.set('NGKeyword', '中古');
  url.searchParams.set('elements', [
    'itemName','itemCode','itemPrice','itemUrl','affiliateUrl','mediumImageUrls','smallImageUrls',
    'availability','reviewCount','reviewAverage','shopName','shopCode','genreId'
  ].join(','));
  return url;
}

export async function runDiscovery({ fetchImpl = fetch, now = new Date() } = {}) {
  const { RAKUTEN_APP_ID, RAKUTEN_ACCESS_KEY, RAKUTEN_AFFILIATE_ID } = process.env;
  if (!RAKUTEN_APP_ID || !RAKUTEN_ACCESS_KEY || !RAKUTEN_AFFILIATE_ID) {
    throw new Error('RAKUTEN_APP_ID / RAKUTEN_ACCESS_KEY / RAKUTEN_AFFILIATE_ID を設定してください。');
  }

  const nowIso = now.toISOString();
  const previousCandidates = await readJson(CANDIDATE_PATH, []);
  const curated = await loadCuratedCatalog();
  const incomingByCode = new Map();
  let successfulQueries = 0;
  const errors = [];
  const queries = [];
  for (const rule of discoveryConfig.rules ?? []) {
    for (const sort of ['-updateTimestamp', '-reviewCount']) queries.push({ rule, sort });
  }

  for (const [index, { rule, sort }] of queries.entries()) {
    const url = buildSearchUrl(rule, sort, RAKUTEN_APP_ID, RAKUTEN_AFFILIATE_ID);
    try {
      const response = await fetchImpl(url, {
        headers: {
          accessKey: RAKUTEN_ACCESS_KEY,
          Referer: RAKUTEN_REFERER,
          Origin: RAKUTEN_ORIGIN,
          'User-Agent': USER_AGENT
        }
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data = await response.json();
      successfulQueries += 1;
      for (const item of extractRows(data)) {
        let candidate = normalizeCandidate(item, rule, nowIso);
        if (!candidate.itemCode || curated.itemCodes.has(candidate.itemCode)) continue;
        if (matchesCuratedModel(candidate.name, candidate.category, curated.products)) {
          candidate = {
            ...candidate,
            status: 'rejected',
            reasons: [...new Set([...(candidate.reasons ?? []), 'curated-model-duplicate'])]
          };
        }
        const previous = incomingByCode.get(candidate.itemCode);
        if (!previous || candidate.qualityScore > previous.qualityScore) incomingByCode.set(candidate.itemCode, candidate);
      }
    } catch (error) {
      errors.push({ rule: rule.id, sort, message: error instanceof Error ? error.message : String(error) });
      console.error(`[discovery:error] ${rule.id} ${sort}: ${errors.at(-1).message}`);
    }
    if (index < queries.length - 1) await sleep(1100);
  }

  if (successfulQueries === 0) {
    throw new Error(`楽天商品発掘に成功した検索が0件です。既存JSONは保持します。errors=${errors.length}`);
  }

  const incoming = [...incomingByCode.values()];
  let merged = mergeCandidatePool(previousCandidates, incoming, nowIso);
  merged = merged.map((row) => curated.itemCodes.has(row.itemCode)
    ? { ...row, status: 'rejected', reasons: [...new Set([...(row.reasons ?? []), 'curated-duplicate'])] }
    : row);
  const publicRows = buildPublicDiscovered(merged);

  await writeFile(CANDIDATE_PATH, `${JSON.stringify(merged, null, 2)}\n`, 'utf8');
  await writeFile(DISCOVERED_PATH, `${JSON.stringify(publicRows, null, 2)}\n`, 'utf8');

  const summary = {
    successfulQueries,
    failedQueries: errors.length,
    incomingCandidates: incoming.length,
    totalCandidates: merged.length,
    publishedProducts: publicRows.length
  };
  console.log(`楽天商品発掘サマリー: ${JSON.stringify(summary)}`);
  return { ...summary, errors, candidates: merged, published: publicRows };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDiscovery().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
