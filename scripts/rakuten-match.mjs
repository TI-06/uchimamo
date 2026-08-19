export function normalizeRakutenText(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/候補/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

export function candidateScore(itemName, product) {
  if (!itemName) return 0;
  const item = normalizeRakutenText(itemName);
  const tokens = `${product.rakuten?.keyword ?? ''} ${product.brand ?? ''} ${product.name ?? ''}`
    .split(/[\s・]+/)
    .map(normalizeRakutenText)
    .filter((token, index, all) => token.length >= 1 && token !== '楽天市場から照合' && all.indexOf(token) === index);
  if (tokens.length === 0) return 0.5;
  return tokens.filter((token) => item.includes(token)).length / tokens.length;
}

function matchesModelTokens(itemName, product) {
  const item = normalizeRakutenText(itemName);
  const required = (product.rakuten?.modelTokens ?? [])
    .map(normalizeRakutenText)
    .filter(Boolean);
  const excluded = (product.rakuten?.excludeTokens ?? [])
    .map(normalizeRakutenText)
    .filter(Boolean);

  if (required.length > 0 && !required.every((token) => item.includes(token))) return false;
  if (excluded.some((token) => item.includes(token))) return false;
  return true;
}

export function selectRakutenCandidate(rows, product) {
  const fixedItemCode = String(product.rakuten?.itemCode ?? '').trim();
  if (fixedItemCode) {
    const item = rows.find((row) => String(row?.itemCode ?? '') === fixedItemCode);
    return item
      ? { item, score: 1, fixed: true, needsReview: false }
      : { item: undefined, score: 0, fixed: true, needsReview: true, reason: 'fixed-item-not-found' };
  }

  const hasModelTokens = Array.isArray(product.rakuten?.modelTokens) && product.rakuten.modelTokens.length > 0;
  const eligibleRows = hasModelTokens
    ? rows.filter((item) => matchesModelTokens(item?.itemName ?? '', product))
    : rows;
  const ranked = eligibleRows
    .map((item) => ({ item, score: candidateScore(item?.itemName ?? '', product) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];

  if (hasModelTokens && !best) {
    return {
      item: undefined,
      score: 0,
      fixed: false,
      needsReview: true,
      reason: 'model-token-mismatch',
      ranked: rows
        .map((item) => ({ item, score: candidateScore(item?.itemName ?? '', product) }))
        .sort((a, b) => b.score - a.score)
    };
  }

  return best
    ? { ...best, fixed: false, needsReview: false, ranked }
    : { item: undefined, score: 0, fixed: false, needsReview: false, ranked };
}
