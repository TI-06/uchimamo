# ウチマモ

**工事なしで始める、わが家の防犯。**

家庭防犯用品を「商品名」ではなく、住まい・守りたい場所・Wi-Fi・電源・工事可否・予算から探せる無料Webサービスです。

## 現在のMVP機能

- 30秒防犯診断
- 防犯用品の条件検索
- 最大3商品の比較
- 商品詳細
- 楽天市場の商品情報キャッシュ
- 楽天アフィリエイトリンク自動表示
- 家庭防犯ガイド基盤
- レスポンシブUI
- SEOメタ / sitemap / robots
- 広告掲載方針 / プライバシーポリシー

## 技術構成

| 項目 | 採用 |
|---|---|
| Framework | Astro 7 |
| Language | TypeScript |
| CSS | Tailwind CSS 4 + custom design tokens |
| Test | Vitest |
| Package Manager | pnpm 11 |
| Hosting | Cloudflare Pages Free |
| Source | GitHub |
| Product API | Rakuten Web Service |
| Product cache | JSON |

固定費0円で運用することを前提としています。

## ローカル起動

Node.js 22.20.0 を使用します。

```bash
corepack enable
pnpm install
pnpm dev
```

テスト・ビルド:

```bash
pnpm test
pnpm build
```

## 楽天アフィリエイト連携

### 必要な値

```text
RAKUTEN_APP_ID
RAKUTEN_ACCESS_KEY
RAKUTEN_AFFILIATE_ID
```

実値はGitへコミットしません。

ローカルで同期する場合は `.env` 等から環境変数を設定して実行します。

```bash
pnpm sync:rakuten
```

同期結果は `src/data/rakuten-cache.json` に保存されます。

ページ表示時に楽天APIを直接呼ばず、キャッシュJSONを静的配信することでAPI負荷と秘密情報の露出を避けます。

### GitHubで自動更新する

リポジトリの **Settings → Secrets and variables → Actions** で、次のRepository secretsを登録します。

```text
RAKUTEN_APP_ID
RAKUTEN_ACCESS_KEY
RAKUTEN_AFFILIATE_ID
```

`.github/workflows/sync-rakuten.yml` が毎日03:20 JSTに同期します。

Secretsが未設定の場合は同期をスキップするため、サイト本体はそのまま利用できます。

## Cloudflare Pagesへ無料公開

GitHubの `TI-06/uchimamo` をCloudflare Pagesへ接続します。

### 推奨設定

| 設定 | 値 |
|---|---|
| Production branch | `main` |
| Framework preset | Astro（またはNone） |
| Build command | `pnpm build` |
| Build output directory | `dist` |
| Root directory | `/` |

環境変数:

```text
NODE_VERSION=22.20.0
PNPM_VERSION=11.20.0
PUBLIC_SITE_URL=https://<Cloudflareで確定したプロジェクト名>.pages.dev
```

Cloudflare PagesのGit連携後は、`main` 更新時に自動再デプロイされます。

楽天APIのSecretはサイトのブラウザ側では使いません。商品同期をGitHub Actionsで行う構成なので、Cloudflare Pagesへ楽天Secretを登録する必要はありません。

## 商品追加

`src/data/products.json` に商品候補を追加します。

楽天連携例:

```json
{
  "rakuten": {
    "enabled": true,
    "keyword": "商品名 検索キーワード"
  }
}
```

可能であれば商品を確認後 `itemCode` を固定し、誤った商品への自動マッチを防ぎます。

## 設計ドキュメント

- `docs/superpowers/specs/2026-08-19-uchimamo-design.md`
- `docs/superpowers/plans/2026-08-19-mvp-foundation.md`

## 運営上の注意

- 防犯を完全に保証する表現をしない
- 価格・在庫・仕様は販売ページの最新情報を優先する
- 広告リンクにはPR/広告であることを明示する
- 推薦順位をアフィリエイト報酬率だけで決めない
- API Key / Access KeyをクライアントJavaScriptへ含めない
