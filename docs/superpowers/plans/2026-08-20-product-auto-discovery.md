# Product Auto-Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 楽天市場から家庭防犯商品を毎日自動発掘し、高信頼候補だけを「自動発掘商品」として安全に公開する。

**Architecture:** 既存30商品はcuratedのまま維持し、楽天API由来の候補を別JSONへ蓄積する。純粋関数の判定モジュールで除外・ブランド検出・品質スコア・公開判定を行い、公開可能な候補だけ`discovered-products.json`へ生成する。UIでは編集済み商品と完全に分離し、未確認スペックを表示・比較・診断に使わない。

**Tech Stack:** Astro 7.2, TypeScript 7, Node.js 22.20, Vitest 4.1, GitHub Actions, Rakuten Ichiba Item Search API 2026-07-01

**Spec:** `docs/superpowers/specs/2026-08-20-product-auto-discovery-design.md`

## Global Constraints

- 既存30商品のデータ・診断・比較ロジックを壊さない。
- 未確認の工事/Wi-Fi/電源/月額/屋外等の仕様を推測しない。
- アフィリエイト率を品質判定・ランキングに使用しない。
- 楽天API Secretsをブラウザへ露出しない。
- 発掘失敗時に最後の成功JSONを消さない。
- PRは実装・テスト・ビルドが完了した最後の1本だけ作成する。

---

### Task 1: 発掘ポリシーを純粋関数化

**Files:**
- Create: `scripts/discovery-policy.mjs`
- Create: `scripts/discovery-policy.test.mjs`
- Create: `src/data/discovery-rules.json`

**Interfaces:**
- Produces: `detectBrand(name, shopName)`, `hasExcludedToken(name)`, `isCategoryMatch(name, rule)`, `scoreCandidate(item, rule)`, `evaluateCandidate(item, rule)`
- `evaluateCandidate` returns `{ status, qualityScore, detectedBrand, reasons }`

- [ ] **Step 1: Write failing tests**

Cover:
- `2台セット`, `中古`, `交換用` are rejected.
- `SwitchBot ロックUltra` detects `SwitchBot`.
- unknown brand remains candidate.
- reviewAverage 4.0 / reviewCount 10 / trusted brand / required token reaches publish only when score >= 80.
- changing `affiliateRate` does not change qualityScore.

- [ ] **Step 2: Run test and confirm RED**

Run: `pnpm vitest run scripts/discovery-policy.test.mjs`
Expected: FAIL because `discovery-policy.mjs` does not exist.

- [ ] **Step 3: Implement minimal policy**

`discovery-rules.json` contains 11 search rules and shared `trustedBrands` / `excludeTokens`. Category rules include `requiredAny` words used to reject accessories or unrelated results.

- [ ] **Step 4: Run test and confirm GREEN**

Run: `pnpm vitest run scripts/discovery-policy.test.mjs`
Expected: all policy tests PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add safe Rakuten discovery policy`

---

### Task 2: 楽天候補発掘スクリプト

**Files:**
- Create: `scripts/discover-rakuten.mjs`
- Create: `scripts/discover-rakuten.test.mjs`
- Create: `src/data/product-candidates.json`
- Create: `src/data/discovered-products.json`
- Modify: `package.json`

**Interfaces:**
- Consumes Task 1 policy functions.
- Produces `mergeCandidatePool(existing, incoming, now)`, `buildPublicDiscovered(candidates)` for unit testing.
- CLI command: `pnpm discover:rakuten`.

- [ ] **Step 1: Write failing tests**

Cover:
- duplicate itemCode is merged, not duplicated.
- existing `discoveredAt` is preserved and `lastSeenAt` updates.
- zero incoming results keep previous `published` candidates.
- rejected candidates never appear in public discovered JSON.
- public discovered records contain only verified marketplace fields and no installation/connectivity/power/score fields.

- [ ] **Step 2: Run test and confirm RED**

Run: `pnpm vitest run scripts/discover-rakuten.test.mjs`
Expected: FAIL because module is missing.

- [ ] **Step 3: Implement API discovery**

For each rule run two searches: `-updateTimestamp` and `-reviewCount` with:
- formatVersion=2
- hits=30
- availability=1
- imageFlag=1
- field=1
- purchaseType=0
- affiliateId
- accessKey header
- Referer/Origin headers
- 1100ms delay

Normalize both `Items` and `items` response shapes. Do not include `affiliateRate` in scoring.

- [ ] **Step 4: Add package script**

Add `"discover:rakuten": "node scripts/discover-rakuten.mjs"`.

- [ ] **Step 5: Run tests and confirm GREEN**

Run: `pnpm vitest run scripts/discovery-policy.test.mjs scripts/discover-rakuten.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: discover and persist Rakuten product candidates`

---

### Task 3: 自動発掘商品カードと商品一覧

**Files:**
- Create: `src/components/DiscoveredProductCard.astro`
- Modify: `src/pages/products/index.astro`
- Create: `src/lib/discovered-products-page.test.ts`

**Interfaces:**
- Card props: `{ product: DiscoveredProduct }`.
- The discovered section does not emit `data-product-card`, `data-compare-checkbox`, or condition data attributes.

- [ ] **Step 1: Write failing page-source test**

Assert:
- products page imports `discovered-products.json`.
- heading contains `新着・自動発掘`.
- explanatory copy contains `詳細仕様は確認中`.
- discovered card source contains no `ウチマモ評価` and no `比較に追加`.

- [ ] **Step 2: Run test and confirm RED**

Run: `pnpm vitest run src/lib/discovered-products-page.test.ts`
Expected: FAIL before component/page change.

- [ ] **Step 3: Implement card**

Display:
- `自動発掘` label
- category
- image
- brand
- name
- price
- Rakuten review
- shop name
- `楽天で詳細を見る` sponsored CTA
- note `楽天市場の商品情報から自動発掘。詳細仕様は確認中です。`

No score, compare, condition chips, or local product detail link.

- [ ] **Step 4: Add section below curated results**

Render only when discovered array length > 0. Existing 30 products/filter behavior stays unchanged.

- [ ] **Step 5: Run test and confirm GREEN**

Run: `pnpm vitest run src/lib/discovered-products-page.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: show safe auto-discovered products`

---

### Task 4: TOPの商品数表示を誤解なく拡張

**Files:**
- Modify: `src/pages/index.astro`
- Modify/Create: `src/lib/home-page.test.ts`

**Interfaces:**
- Curated count remains `products.length`.
- Discovered count comes from `discovered-products.json`.

- [ ] **Step 1: Add failing test**

Require TOP to distinguish:
- `編集済み 30商品`
- when discovered > 0, `+ 自動発掘 N商品`

- [ ] **Step 2: Verify RED**

Run: `pnpm vitest run src/lib/home-page.test.ts`
Expected: FAIL because discovered count is not rendered.

- [ ] **Step 3: Implement count display**

Do not call all auto-discovered products “比較対象”. Copy must make curated/discovered distinction clear.

- [ ] **Step 4: Verify GREEN**

Run: `pnpm vitest run src/lib/home-page.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: surface auto-discovered catalog count`

---

### Task 5: 毎日自動発掘するGitHub Actions

**Files:**
- Create: `.github/workflows/discover-rakuten-products.yml`
- Modify: `README.md`

**Interfaces:**
- Uses existing secrets `RAKUTEN_APP_ID`, `RAKUTEN_ACCESS_KEY`, `RAKUTEN_AFFILIATE_ID`.
- Writes only `src/data/product-candidates.json` and `src/data/discovered-products.json`.

- [ ] **Step 1: Create workflow**

Triggers:
- `workflow_dispatch`
- `schedule: 10 19 * * *` (04:10 JST)

Use Node 22.20.0, Corepack, pnpm install, credentials check, `pnpm discover:rakuten`, commit only if JSON changed. Use `concurrency.group=discover-rakuten-products`, `cancel-in-progress=true`.

- [ ] **Step 2: Document operational behavior**

README explains curated vs discovered, daily schedule, and that auto-discovered items do not participate in diagnosis/compare until curated.

- [ ] **Step 3: Run complete tests**

Run: `pnpm test`
Expected: all tests PASS.

- [ ] **Step 4: Run production build**

Run: `pnpm build`
Expected: Astro build completes successfully.

- [ ] **Step 5: Create one non-draft PR**

Only after all implementation is complete. Verify CI + Cloudflare Preview, then merge to main.

- [ ] **Step 6: Run first real discovery**

After merge, manually trigger `Discover Rakuten Products` once if the push path does not automatically run it. Verify candidate/public JSON counts and confirm no existing curated product was modified.
