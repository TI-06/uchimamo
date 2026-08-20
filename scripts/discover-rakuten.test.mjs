import { describe, expect, it } from 'vitest';
import {
  applyPublicationRoutes,
  buildDiscoverySummary,
  buildPublicDiscovered,
  matchesCuratedModel,
  mergeCandidatePool
} from './discover-rakuten.mjs';

const published = {
  itemCode: 'shop:1001',
  name: 'SwitchBot 防犯カメラ C900',
  shopName: 'SwitchBot公式店',
  shopCode: 'shop',
  itemUrl: 'https://example.com/item',
  affiliateUrl: 'https://example.com/affiliate',
  imageUrl: 'https://example.com/image.jpg',
  price: 12800,
  reviewAverage: 4.5,
  reviewCount: 50,
  genreId: 1,
  category: 'camera',
  detectedBrand: 'SwitchBot',
  modelIdentity: 'C900',
  sourceKeyword: '防犯カメラ 屋外',
  qualityScore: 95,
  coreEligible: true,
  publicationRoute: 'popular',
  status: 'published',
  reasons: [],
  discoveredAt: '2026-08-19T00:00:00.000Z',
  lastSeenAt: '2026-08-19T00:00:00.000Z'
};

const lowReviewCandidate = {
  ...published,
  itemCode: 'shop:new1',
  name: 'Tapo C530WS 防犯カメラ',
  reviewAverage: 0,
  reviewCount: 0,
  qualityScore: 50,
  status: 'candidate',
  publicationRoute: '',
  reasons: ['review-average-below-4.0', 'review-count-below-10', 'quality-score-below-80']
};

describe('candidate persistence', () => {
  it('同じitemCodeは重複せずdiscoveredAtを維持してlastSeenAtを更新する', () => {
    const merged = mergeCandidatePool([published], [{ ...published, price: 11800 }], '2026-08-20T00:00:00.000Z');
    expect(merged).toHaveLength(1);
    expect(merged[0].discoveredAt).toBe('2026-08-19T00:00:00.000Z');
    expect(merged[0].lastSeenAt).toBe('2026-08-20T00:00:00.000Z');
    expect(merged[0].price).toBe(11800);
  });

  it('APIが0件でも既存published候補を消さない', () => {
    const merged = mergeCandidatePool([published], [], '2026-08-20T00:00:00.000Z');
    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe('published');
  });
});

describe('publication routes', () => {
  it('初回発見でコア条件を満たす低レビュー商品はnewとして公開する', () => {
    const rows = applyPublicationRoutes([lowReviewCandidate], new Map(), '2026-08-20T00:00:00.000Z');
    expect(rows[0].status).toBe('published');
    expect(rows[0].publicationRoute).toBe('new');
  });

  it('直近7日以内に候補化済みの安全商品もnewとして公開する', () => {
    const previous = new Map([[lowReviewCandidate.itemCode, { ...lowReviewCandidate, status: 'candidate' }]]);
    const rows = applyPublicationRoutes([lowReviewCandidate], previous, '2026-08-20T00:00:00.000Z');
    expect(rows[0].status).toBe('published');
    expect(rows[0].publicationRoute).toBe('new');
  });

  it('古い候補を新商品扱いで突然公開しない', () => {
    const old = { ...lowReviewCandidate, discoveredAt: '2026-08-01T00:00:00.000Z' };
    const previous = new Map([[old.itemCode, { ...old, status: 'candidate' }]]);
    const rows = applyPublicationRoutes([old], previous, '2026-08-20T00:00:00.000Z');
    expect(rows[0].status).toBe('candidate');
    expect(rows[0].publicationRoute).toBe('');
  });

  it('一度new公開した商品はレビュー蓄積中でもnew公開を維持する', () => {
    const previous = new Map([[lowReviewCandidate.itemCode, { ...lowReviewCandidate, status: 'published', publicationRoute: 'new' }]]);
    const rows = applyPublicationRoutes([lowReviewCandidate], previous, '2026-08-20T00:00:00.000Z');
    expect(rows[0].status).toBe('published');
    expect(rows[0].publicationRoute).toBe('new');
  });

  it('人気基準を満たした商品はpopularを優先する', () => {
    const rows = applyPublicationRoutes([published], new Map(), '2026-08-20T00:00:00.000Z');
    expect(rows[0].status).toBe('published');
    expect(rows[0].publicationRoute).toBe('popular');
  });
});

describe('curated duplicate detection', () => {
  const curated = [
    { id: 'tapo-c425', brand: 'TP-Link Tapo', category: 'camera', rakuten: { modelTokens: ['Tapo', 'C425'] } },
    { id: 'switchbot-ultra', brand: 'SwitchBot', category: 'smart-lock', rakuten: { modelTokens: ['SwitchBot', 'ロックUltra'] } }
  ];

  it('別ショップでも既存モデルと同じなら重複扱いにする', () => {
    expect(matchesCuratedModel('Tapo C425 防犯カメラ 屋外', 'camera', curated)).toBe(true);
    expect(matchesCuratedModel('SwitchBot ロックUltra 顔認証パッドセット', 'smart-lock', curated)).toBe(true);
  });

  it('空白や記号の差があっても既存モデルを重複扱いにする', () => {
    expect(matchesCuratedModel('SwitchBot スマートロック Ultra 顔認証パッドPro', 'smart-lock', curated)).toBe(true);
  });

  it('別モデルは重複扱いにしない', () => {
    expect(matchesCuratedModel('Tapo C530WS 防犯カメラ', 'camera', curated)).toBe(false);
  });
});

describe('public discovered catalog', () => {
  it('publishedだけを公開しrouteを含め、未確認スペックや独自scoreを含めない', () => {
    const rows = buildPublicDiscovered([
      published,
      { ...published, itemCode: 'shop:2', status: 'candidate' },
      { ...published, itemCode: 'shop:3', status: 'rejected' }
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(expect.objectContaining({
      itemCode: 'shop:1001',
      category: 'camera',
      brand: 'SwitchBot',
      publicationRoute: 'popular'
    }));
    expect(rows[0]).not.toHaveProperty('installation');
    expect(rows[0]).not.toHaveProperty('connectivity');
    expect(rows[0]).not.toHaveProperty('power');
    expect(rows[0]).not.toHaveProperty('score');
    expect(rows[0]).not.toHaveProperty('qualityScore');
  });
});

describe('discovery summary', () => {
  it('new/popular/candidate/rejected/duplicateの件数を集計する', () => {
    const rows = [
      published,
      { ...published, itemCode: 'shop:new', publicationRoute: 'new' },
      { ...published, itemCode: 'shop:candidate', status: 'candidate', publicationRoute: '' },
      { ...published, itemCode: 'shop:reject', status: 'rejected', publicationRoute: '' },
      { ...published, itemCode: 'shop:dup', status: 'rejected', publicationRoute: '', reasons: ['curated-model-duplicate'] }
    ];
    const summary = buildDiscoverySummary(rows, {
      checkedAt: '2026-08-20T00:00:00.000Z',
      successfulQueries: 20,
      failedQueries: 2,
      incomingCandidates: 50
    });
    expect(summary).toEqual(expect.objectContaining({
      publishedProducts: 2,
      publishedNew: 1,
      publishedPopular: 1,
      candidateOnly: 1,
      rejected: 2,
      curatedDuplicates: 1
    }));
  });
});
