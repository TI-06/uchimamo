# ウチマモ Premium Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 商品固定と全体UI刷新を行い、ウチマモを高品質な家庭防犯比較・診断サービスとして仕上げる。

**Architecture:** Astroの静的構成と既存の商品JSON / 楽天キャッシュを維持する。新しい依存を増やさず、共通CSS・小さな表示helper・既存Astroページの情報設計を改善する。楽天同期では固定itemCodeを厳密に扱い、自動すり替えを防止する。

**Tech Stack:** Astro 7 / TypeScript / Tailwind CSS 4 / vanilla client-side JavaScript / Vitest / GitHub Actions

**Spec:** `docs/superpowers/specs/2026-08-19-premium-refresh-design.md`

## Global Constraints

- 初期費用・月額固定費は0円運用を維持する。
- Astro + TypeScript構成を維持し、大きなUI frameworkを追加しない。
- 楽天SecretsはGitHub Repository Secretsのみで扱い、公開コードへ保存しない。
- 独自評価と楽天市場レビューを明確に区別する。
- 固定itemCodeが取得不能でも他商品へ自動すり替えしない。
- Draft PRではCIを実行しない。main pushとnon-draft PRではCIを実行する。
- mobile bottom navと固定比較UIを干渉させない。

---

### Task 1: CI notification noise reduction

**Files:**
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: GitHub pull_request draft state
- Produces: main push / non-draft PRだけで動く `test-build` job

- [ ] Draft PRで `test-build` をskipするjob条件を追加する。
- [ ] 既存concurrency / cancel-in-progressは維持する。
- [ ] YAML構造をレビューする。
- [ ] Commit: `ci: skip draft pull request checks`

### Task 2: Pin Rakuten products and fail closed

**Files:**
- Modify: `src/data/products.json`
- Modify: `scripts/sync-rakuten.mjs`
- Modify: `src/lib/rakuten.ts`
- Modify: `src/lib/rakuten.test.ts`

**Interfaces:**
- Consumes: `product.rakuten.itemCode`, Rakuten `Items` / `items`
- Produces: fixed item cache and `needsReview` sync status

- [ ] 6商品の `rakuten.itemCode` を現在の確認済みitemCodeで固定する。
- [ ] fixed itemCodeがある場合の候補scoreをitemCode完全一致で判定する。
- [ ] fixed itemCodeが結果にない場合は別候補を採用せずskip / needs-reviewにする。
- [ ] status JSONへ `needsReview` を追加する。
- [ ] 大文字 `Items` / 小文字 `items` の両対応を維持する。
- [ ] fixed itemCodeの完全一致テストを追加する。
- [ ] Commit: `fix: pin Rakuten products to reviewed items`

### Task 3: Shared premium design system

**Files:**
- Modify: `src/styles/global.css`
- Modify: `src/components/Header.astro`
- Modify: `src/components/BottomNav.astro`
- Modify: `src/components/Footer.astro`

**Interfaces:**
- Produces: premium surface, button, badge, metadata and focus styles consumed by all pages

- [ ] Quiet Premium palette tokensを追加する。
- [ ] primary CTAをディープネイビー中心に変更する。
- [ ] card shadow / radiusを抑え、境界と余白中心へ変更する。
- [ ] `focus-visible`を追加する。
- [ ] Header / Footer / BottomNavの余白と階層を統一する。
- [ ] Commit: `style: establish premium visual system`

### Task 4: Product card and finder refresh

**Files:**
- Modify: `src/components/ProductCard.astro`
- Modify: `src/pages/products/index.astro`

**Interfaces:**
- Consumes: product master and Rakuten cache
- Produces: visually consistent cards and compare selection bar

- [ ] scoreを `ウチマモ評価` ラベル付きに変更する。
- [ ] 楽天レビューを `楽天市場レビュー` と明示する。
- [ ] `fetchedAt`から確認日を表示する。
- [ ] CTA hierarchyを整理する。
- [ ] compare操作をボタン風にする。
- [ ] compare barへ商品画像・短縮商品名・remove UIを追加する。
- [ ] mobile bottom navと干渉しない位置にする。
- [ ] Commit: `feat: refresh product finder experience`

### Task 5: Product detail refresh

**Files:**
- Modify: `src/pages/products/[id].astro`

**Interfaces:**
- Consumes: product master / Rakuten cache
- Produces: verdict-first product detail experience

- [ ] heroを画像・商品情報・購入boxの明確な3領域へ整理する。
- [ ] `ウチマモの結論` sectionを追加する。
- [ ] メリット / 注意点をproduct propertiesから生成する。
- [ ] score説明を明確化する。
- [ ] 楽天レビュー / shop / 更新日を購入boxで分離する。
- [ ] compare / diagnosis導線を追加する。
- [ ] Commit: `feat: redesign product detail pages`

### Task 6: Compare page full redesign

**Files:**
- Modify: `src/pages/compare.astro`

**Interfaces:**
- Consumes: `ids` query, products, Rakuten cache
- Produces: product summary cards, verdicts, grouped comparison matrix and difference-only toggle

- [ ] selected product summary cardsを上部へ追加する。
- [ ] automatic verdictsをproduct attributesから生成する。
- [ ] comparison rowsを「基本情報 / 設置 / 電源・通信 / 維持費」にgroup化する。
- [ ] difference-only toggleを実装する。
- [ ] desktopではsticky product headerを実装する。
- [ ] mobileでは左ラベル固定 + 商品列スワイプのmatrixへ変更する。
- [ ] 楽天価格・楽天レビュー・CTAを商品headerに保持する。
- [ ] Commit: `feat: rebuild product comparison experience`

### Task 7: Diagnosis result refresh

**Files:**
- Modify: `src/pages/diagnosis/index.astro`

**Interfaces:**
- Consumes: `diagnoseSecurity()` result, products, cache
- Produces: visual recommendations with reason / fit / price / review

- [ ] recommendationへ商品画像を追加する。
- [ ] 診断条件から「あなた向けの理由」を表示する。
- [ ] price / 楽天レビューを表示する。
- [ ] detail / Rakuten CTA hierarchyを整理する。
- [ ] 「なぜこの結果？」説明を追加する。
- [ ] Commit: `feat: polish security diagnosis results`

### Task 8: Home page premium refresh

**Files:**
- Modify: `src/pages/index.astro`

**Interfaces:**
- Consumes: product master / cache
- Produces: trust-first homepage and use-case pickup

- [ ] Heroの良い構造を維持し、装飾をpremium化する。
- [ ] trust stripを追加する。
- [ ] placeアイコンをinline SVGへ変更する。
- [ ] PICK UPを玄関 / 屋外 / 窓で固定する。
- [ ] 商品情報の確認日 / 評価基準導線を追加する。
- [ ] Commit: `feat: elevate home page trust and merchandising`

### Task 9: Guide visual consistency

**Files:**
- Modify: `src/pages/guide/index.astro`
- Modify: `src/pages/guide/[slug].astro`

**Interfaces:**
- Consumes: guide catalog
- Produces: editorial-style guide index and article pages

- [ ] guide indexのカード密度を下げる。
- [ ] article headerへ更新方針・結論・対象読者を整理する。
- [ ] article末尾のdiagnosis / products CTAを統一する。
- [ ] Commit: `style: align guides with premium editorial design`

### Task 10: Verification and launch PR

**Files:**
- Review all files above

**Interfaces:**
- Produces: one non-draft PR ready for CI and merge

- [ ] PRを作成する前に変更diffをレビューする。
- [ ] PRをnon-draftで1回だけ作成する。
- [ ] GitHub Actionsで `pnpm test` がGREENであることを確認する。
- [ ] GitHub Actionsで `pnpm build` がGREENであることを確認する。
- [ ] PR file diffを最終レビューする。
- [ ] mainへmergeする。
- [ ] mainのCloudflare Pages反映を確認する。
