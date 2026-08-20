import { readFileSync } from 'node:fs';

const config = JSON.parse(readFileSync(new URL('../src/data/discovery-rules.json', import.meta.url), 'utf8'));

const normalize = (value) => String(value ?? '').normalize('NFKC').toLowerCase();
const MODEL_SPEC_PATTERNS = [
  /^ip\d+$/i,
  /^\d+k$/i,
  /^\d+mp$/i,
  /^\d+w$/i,
  /^\d+mah$/i,
  /^\d+led$/i,
  /^wifi\d+$/i,
  /^usb\d+$/i,
  /^\d+hz$/i,
  /^\d+v$/i,
  /^\d+db$/i
];

export function detectBrand(name, shopName, customConfig = config) {
  const haystack = normalize(`${name} ${shopName}`);
  for (const brand of customConfig.trustedBrands ?? []) {
    if ((brand.tokens ?? []).some((token) => haystack.includes(normalize(token)))) return brand.name;
  }
  return '';
}

export function extractModelIdentity(name) {
  const source = String(name ?? '').normalize('NFKC');
  const matches = source.match(/[A-Za-z]+[-_]?\d+[A-Za-z0-9-]*|\d+[A-Za-z]+[A-Za-z0-9-]*/g) ?? [];
  for (const match of matches) {
    const cleaned = match.replace(/_/g, '-');
    if (MODEL_SPEC_PATTERNS.some((pattern) => pattern.test(cleaned))) continue;
    return cleaned;
  }
  return '';
}

export function hasExcludedToken(name, customConfig = config) {
  const normalizedName = normalize(name);
  return (customConfig.excludeTokens ?? []).find((token) => normalizedName.includes(normalize(token))) ?? '';
}

export function categoryExcludedToken(name, rule) {
  const normalizedName = normalize(name);
  return (rule.excludeAny ?? []).find((token) => normalizedName.includes(normalize(token))) ?? '';
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
  const coreReasons = [];
  const name = String(item?.itemName ?? '');
  const excluded = hasExcludedToken(name, customConfig);
  const categoryExcluded = categoryExcludedToken(name, rule);
  const detectedBrand = detectBrand(name, item?.shopName, customConfig);
  const modelIdentity = extractModelIdentity(name);
  const qualityScore = scoreCandidate(item, rule, customConfig);
  const average = Number(item?.reviewAverage ?? 0);
  const count = Number(item?.reviewCount ?? 0);
  const price = Number(item?.itemPrice ?? 0);
  const available = Number(item?.availability ?? 1) === 1;
  const minPrice = Number(rule?.minPrice ?? 0);
  const maxPrice = Number(rule?.maxPrice ?? Number.MAX_SAFE_INTEGER);

  if (excluded) reasons.push(`excluded-token:${excluded}`);
  if (categoryExcluded) reasons.push(`category-excluded:${categoryExcluded}`);
  if (!isCategoryMatch(name, rule)) reasons.push('category-mismatch');

  if (reasons.length > 0) {
    return {
      status: 'rejected',
      publicationRoute: '',
      coreEligible: false,
      qualityScore,
      detectedBrand,
      modelIdentity,
      reasons
    };
  }

  if (!detectedBrand) coreReasons.push('trusted-brand-required');
  if (!modelIdentity) coreReasons.push('model-identity-required');
  if (!available) coreReasons.push('unavailable');
  if (!imageUrl(item)) coreReasons.push('image-required');
  if (!(price > 0)) coreReasons.push('price-required');
  if (price > 0 && (price < minPrice || price > maxPrice)) coreReasons.push('price-out-of-range');
  if (!item?.affiliateUrl) coreReasons.push('affiliate-url-required');
  reasons.push(...coreReasons);

  const coreEligible = coreReasons.length === 0;
  if (average < 4.0) reasons.push('review-average-below-4.0');
  if (count < 10) reasons.push('review-count-below-10');
  if (qualityScore < 80) reasons.push('quality-score-below-80');

  const popularEligible = coreEligible && average >= 4.0 && count >= 10 && qualityScore >= 80;

  return {
    status: popularEligible ? 'published' : 'candidate',
    publicationRoute: popularEligible ? 'popular' : '',
    coreEligible,
    qualityScore,
    detectedBrand,
    modelIdentity,
    reasons
  };
}

export function firstImageUrl(item) {
  return imageUrl(item);
}

export { config as discoveryConfig };
