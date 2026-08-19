import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../src/data/discovery-rules.json', import.meta.url), 'utf8'));

const normalize = (value) => String(value ?? '').normalize('NFKC').toLowerCase();

export function detectBrand(name, shopName, customConfig = config) {
  const haystack = normalize(`${name} ${shopName}`);
  for (const brand of customConfig.trustedBrands ?? []) {
    if ((brand.tokens ?? []).some((token) => haystack.includes(normalize(token)))) return brand.name;
  }
  return '';
}

export function hasExcludedToken(name, customConfig = config) {
  const normalizedName = normalize(name);
  return (customConfig.excludeTokens ?? []).find((token) => normalizedName.includes(normalize(token))) ?? '';
}

export function isCategoryMatch(name, rule) {
  const normalizedName = normalize(name);
  return (rule.requiredAny ?? []).some((token) => normalizedName.includes(normalize(token)));
}

function imageUrl(item) {
  const lists = [item?.mediumImageUrls, item?.smallImageUrls];
  for (const list of lists) {
    if (!Array.isArray(list) || list.length === 0) continue;
    const first = list[0];
    if (typeof first === 'string' && first) return first;
    if (first && typeof first === 'object' && typeof first.imageUrl === 'string') return first.imageUrl;
  }
  return '';
}

export function scoreCandidate(item, rule, customConfig = config) {
  let score = 0;
  const brand = detectBrand(item?.itemName, item?.shopName, customConfig);
  const average = Number(item?.reviewAverage ?? 0);
  const count = Number(item?.reviewCount ?? 0);
  const price = Number(item?.itemPrice ?? 0);

  if (brand) score += 30;
  if (average >= 4.3) score += 25;
  else if (average >= 4.0) score += 20;

  if (count >= 100) score += 25;
  else if (count >= 30) score += 20;
  else if (count >= 10) score += 15;

  if (imageUrl(item)) score += 10;
  if (price > 0) score += 5;
  if (item?.affiliateUrl) score += 5;

  return Math.min(score, 100);
}

export function evaluateCandidate(item, rule, customConfig = config) {
  const reasons = [];
  const name = String(item?.itemName ?? '');
  const excluded = hasExcludedToken(name, customConfig);
  const detectedBrand = detectBrand(name, item?.shopName, customConfig);
  const qualityScore = scoreCandidate(item, rule, customConfig);
  const average = Number(item?.reviewAverage ?? 0);
  const count = Number(item?.reviewCount ?? 0);
  const price = Number(item?.itemPrice ?? 0);
  const available = Number(item?.availability ?? 1) === 1;
  const minPrice = Number(rule?.minPrice ?? 0);
  const maxPrice = Number(rule?.maxPrice ?? Number.MAX_SAFE_INTEGER);

  if (excluded) reasons.push(`excluded-token:${excluded}`);
  if (!isCategoryMatch(name, rule)) reasons.push('category-mismatch');

  if (reasons.length > 0) {
    return { status: 'rejected', qualityScore, detectedBrand, reasons };
  }

  if (!detectedBrand) reasons.push('trusted-brand-required');
  if (!available) reasons.push('unavailable');
  if (!imageUrl(item)) reasons.push('image-required');
  if (!(price > 0)) reasons.push('price-required');
  if (price > 0 && (price < minPrice || price > maxPrice)) reasons.push('price-out-of-range');
  if (!item?.affiliateUrl) reasons.push('affiliate-url-required');
  if (average < 4.0) reasons.push('review-average-below-4.0');
  if (count < 10) reasons.push('review-count-below-10');
  if (qualityScore < 80) reasons.push('quality-score-below-80');

  return {
    status: reasons.length === 0 ? 'published' : 'candidate',
    qualityScore,
    detectedBrand,
    reasons
  };
}

export function firstImageUrl(item) {
  return imageUrl(item);
}

export { config as discoveryConfig };
