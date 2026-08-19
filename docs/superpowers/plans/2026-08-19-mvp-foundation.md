# ウチマモ MVP Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完全無料構成のウチマモMVPとして、商品検索・比較・防犯診断・楽天連携の基盤を備えたレスポンシブAstroサイトを公開可能な状態まで構築する。

**Architecture:** Astroの静的生成を中心に、商品マスタと楽天同期キャッシュをJSONで保持する。診断・検索・比較の純粋ロジックはTypeScriptモジュールへ分離しVitestでテストし、UIはAstroコンポーネントと必要最小限のクライアントJavaScriptで構成する。

**Tech Stack:** Astro, TypeScript, Tailwind CSS, Vitest, Cloudflare Pages, Rakuten Web Service

**Spec:** `docs/superpowers/specs/2026-08-19-uchimamo-design.md`

## Global Constraints

- 初期費用・月額費用とも0円。
- 独自ドメイン、有料CMS、有料DB、有料APIを使わない。
- 楽天のAccess Key/Affiliate IDはGitへ保存せず環境変数で扱う。
- スマホファースト、SEO、PR表記を必須とする。
- 楽天APIは閲覧時に直接呼ばず、同期キャッシュを静的配信する。
- 商品推薦順位はアフィリエイト料率ではなく適合度で決める。

---

### Task 1: Astro基盤と品質ゲート

**Files:** `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`, `src/styles/global.css`, `src/layouts/BaseLayout.astro`

**Interfaces:** 共通レイアウト `BaseLayout` と全ページ共通CSSを提供する。

- [ ] Vitestで基盤テストを先に追加し、未実装状態で失敗を確認する。
- [ ] Astro/TypeScript/Tailwind相当のCSS基盤を最小構成で追加する。
- [ ] `npm test` と `npm run build` が成功することを確認する。
- [ ] コミットする。

### Task 2: 商品モデル・絞り込み・比較ロジック

**Files:** `src/types/product.ts`, `src/data/products.json`, `src/lib/products.ts`, `src/lib/products.test.ts`

**Interfaces:** `getProducts()`, `filterProducts(filters)`, `compareProducts(ids)` を提供する。

- [ ] 絞り込み・最大3件比較の失敗テストを追加する。
- [ ] 商品型と初期サンプル商品データを追加する。
- [ ] 最小実装でテストを通す。
- [ ] 全テストを実行しコミットする。

### Task 3: 防犯診断エンジン

**Files:** `src/lib/diagnosis.ts`, `src/lib/diagnosis.test.ts`

**Interfaces:** `diagnoseSecurity(answers, products)` がスコア、優先対策、推奨商品IDを返す。

- [ ] 戸建て/玄関/工事不可等の代表ケースの失敗テストを追加する。
- [ ] 報酬率に依存しない適合度スコアを実装する。
- [ ] 境界値を含むテストを通す。
- [ ] コミットする。

### Task 4: 楽天同期・キャッシュ変換

**Files:** `scripts/sync-rakuten.mjs`, `src/lib/rakuten.ts`, `src/lib/rakuten.test.ts`, `src/data/rakuten-cache.json`, `.env.example`

**Interfaces:** `buildRakutenRequest()`, `normalizeRakutenItem()` と `npm run sync:rakuten` を提供する。

- [ ] URL生成・レスポンス正規化の失敗テストを追加する。
- [ ] Secretをクライアントへ露出しない同期スクリプトを実装する。
- [ ] API失敗時は既存キャッシュを保持する。
- [ ] テスト後コミットする。

### Task 5: 商品UI・検索・比較ページ

**Files:** `src/components/ProductCard.astro`, `src/pages/products/index.astro`, `src/pages/products/[id].astro`, `src/pages/compare.astro`

**Interfaces:** 商品カード、商品一覧、商品詳細、最大3商品比較UIを提供する。

- [ ] ロジックテストを先に追加/更新する。
- [ ] スマホ/PC対応カード、フィルター、比較導線を実装する。
- [ ] PR表示、外部リンク属性、楽天/ASPの併記を実装する。
- [ ] buildを確認しコミットする。

### Task 6: 防犯診断UIとTOP

**Files:** `src/pages/index.astro`, `src/pages/diagnosis/index.astro`, `src/components/Header.astro`, `src/components/Footer.astro`, `src/components/BottomNav.astro`

**Interfaces:** TOPから30秒診断、場所/条件/商品検索へ遷移できる。

- [ ] 診断結果の純粋ロジックテストを拡張する。
- [ ] 1画面1質問の診断UIと結果表示を実装する。
- [ ] TOPをブログ一覧ではなくWebサービス型レイアウトで構築する。
- [ ] 375/768/1440pxを意識したCSSを実装する。
- [ ] build確認後コミットする。

### Task 7: SEO・固定ページ・Cloudflare公開準備

**Files:** `public/robots.txt`, `src/pages/about.astro`, `src/pages/privacy.astro`, `src/pages/affiliate-policy.astro`, `src/pages/contact.astro`, `README.md`

**Interfaces:** 公開に必要なSEO/運営情報とCloudflare Pages設定手順を提供する。

- [ ] canonical/OGP/構造化データの出力を確認するテストを追加する。
- [ ] 固定ページと免責・PR方針を追加する。
- [ ] `npm test` と `npm run build` を最終実行する。
- [ ] READMEにCloudflare Pages無料公開と楽天Secret設定手順を記載する。
- [ ] コミットし、mainとの差分をレビューする。
