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

export function selectRakutenCandidate(rows, product) {
  const fixedItemCode = String(product.rakuten?.itemCode ?? '').trim();
  if (fixedItemCode) {
    const item = rows.find((row) => String(row?.itemCode ?? '') === fixedItemCode);
    return item
      ? { item, score: 1, fixed: true, needsReview: false }
      : { item: undefined, score: 0, fixed: true, needsReview: true };
  }

  const ranked = rows
    .map((item) => ({ item, score: candidateScore(item?.itemName ?? '', product) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  return best
    ? { ...best, fixed: false, needsReview: false, ranked }
    : { item: undefined, score: 0, fixed: false, needsReview: false, ranked };
}
