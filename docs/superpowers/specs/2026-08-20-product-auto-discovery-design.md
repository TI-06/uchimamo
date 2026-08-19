# ウチマモ 商品自動発掘・安全公開 設計

## 目的

楽天市場から家庭防犯の新商品・人気商品候補を毎日自動発掘し、既存30商品との重複や誤商品を排除しながら、ウチマモの商品一覧を継続的に成長させる。

ただし、楽天の商品名だけでは工事要否・Wi-Fi要否・電源方式などを正確に断定できないため、自動発掘商品と編集済み商品を分離する。未確認スペックを推測して診断・詳細条件比較へ混入させない。

## 方針

### 1. 2段階カタログ

- `curated`：現在の30商品。編集済み。独自評価・条件検索・診断・比較に参加する。
- `discovered`：楽天APIから自動発掘。価格・画像・楽天レビュー・ブランド・カテゴリなど確認可能な情報だけ公開する。
- `candidate`：品質基準を満たさない/レビュー不足/ブランド不明等。本番非公開で候補プールに保持する。

自動発掘商品は「自動発掘・仕様確認中」と明示し、独自評価スコアを表示しない。比較追加・条件フィルター・診断候補には含めない。

### 2. 発掘元

楽天市場 Item Search API 2026-07-01 を利用する。

- `hits=30`
- `availability=1`
- `imageFlag=1`
- `field=1`
- `purchaseType=0`
- `sort=-updateTimestamp` と `sort=-reviewCount` の2系統
- `affiliateId` を付与
- Access KeyはHTTPヘッダー
- Referer/Originは `https://uchimamo.pages.dev/`
- 各リクエスト間に1.1秒以上の待機

### 3. 検索ルール

5カテゴリを対象にする。

- camera
  - `防犯カメラ 屋外`
  - `防犯カメラ バッテリー`
  - `防犯カメラ ソーラー`
- smart-lock
  - `スマートロック 後付け`
  - `電子錠 後付け`
- sensor
  - `開閉センサー 防犯`
  - `人感センサー 防犯`
- window-lock
  - `窓 防犯 補助錠`
  - `サッシ 防犯 錠`
- light
  - `センサーライト 防犯`
  - `ソーラー センサーライト`

検索ルールは `src/data/discovery-rules.json` に置き、コード変更なしで増減可能にする。

### 4. 候補データ

`src/data/product-candidates.json` に永続化する。

各候補は以下を持つ。

- itemCode
- name
- shopName / shopCode
- itemUrl / affiliateUrl
- imageUrl
- price
- reviewAverage / reviewCount
- genreId
- category
- detectedBrand
- sourceKeyword
- qualityScore
- status: `candidate | published | rejected | stale`
- reasons[]
- discoveredAt
- lastSeenAt

### 5. 重複排除

以下を既存商品として扱う。

- `src/data/rakuten-cache.json` のitemCode
- `src/data/products.json`
- `src/data/products-extra.json`
- `src/data/products-replacements.json`
- `src/data/product-candidates.json` の既存itemCode

itemCodeを第一キーとする。同一itemCodeは1候補のみ。

### 6. 除外条件

商品名に以下が含まれる場合は `rejected` とする。

- 中古
- ジャンク
- 訳あり
- 部品
- 交換用
- ケース
- カバー
- ホルダー
- ステッカー
- 取付金具
- ブラケット
- ケーブルのみ
- アダプターのみ
- 2台セット
- 3台セット
- 4台セット
- まとめ買い
- 福袋

カテゴリごとに本体らしさを示す必須語も設定し、検索語に引っかかっただけの周辺アクセサリを除外する。

### 7. 信頼ブランド

初期の自動公開対象ブランドをallowlist化する。

- SwitchBot
- Tapo / TP-Link
- Eufy / Anker
- Ring
- Aqara
- SESAME / CANDY HOUSE
- アイリスオーヤマ
- ELPA
- ムサシ / RITEX
- ノムラテック
- Panasonic

allowlist外の商品も候補として保存するが、自動公開しない。

### 8. 品質スコアと自動公開

品質スコアはアフィリエイト率を一切使わない。

加点要素:
- 信頼ブランド: +30
- reviewAverage >= 4.3: +25
- reviewAverage >= 4.0: +20
- reviewCount >= 100: +25
- reviewCount >= 30: +20
- reviewCount >= 10: +15
- 画像あり: +10
- 価格あり: +5
- affiliateUrlあり: +5

自動公開条件:
- 信頼ブランド
- 除外条件に該当しない
- カテゴリ必須語に一致
- availability=1
- imageUrlあり
- price > 0
- affiliateUrlあり
- reviewAverage >= 4.0
- reviewCount >= 10
- qualityScore >= 80

上記を満たさないものは候補プールに残す。

### 9. 公開用自動発掘カタログ

`src/data/discovered-products.json` を生成する。

公開項目:
- id (`rakuten-<shopCode>-<itemCodeSuffix>`のslug化)
- source=`discovered`
- itemCode
- name
- brand
- category
- price
- imageUrl
- affiliateUrl
- itemUrl
- reviewAverage
- reviewCount
- shopName
- discoveredAt
- lastSeenAt

推測しない項目:
- 工事不要
- Wi-Fi要否
- 電源方式
- 月額要否
- 屋外性能
- ストレージ
- 独自評価

### 10. UI

商品一覧に「新着・自動発掘」セクションを追加する。

- 編集済み商品と視覚的に分離
- 「楽天市場の商品情報から自動発掘。詳細仕様は確認中」と明示
- 楽天画像・商品名・ブランド・価格・楽天レビューを表示
- `楽天で詳細を見る` CTA
- 比較追加ボタンなし
- 独自評価なし
- 条件フィルターの対象外

TOPでは商品総数を「編集済み30商品 + 自動発掘N商品」と誤解なく表示できるようにする。

### 11. GitHub Actions

`.github/workflows/discover-rakuten-products.yml`

- `workflow_dispatch`
- 毎日 04:10 JST (19:10 UTC)
- Secrets:
  - RAKUTEN_APP_ID
  - RAKUTEN_ACCESS_KEY
  - RAKUTEN_AFFILIATE_ID
- `pnpm discover:rakuten`
- `product-candidates.json` / `discovered-products.json` が変化した時のみmainへコミット
- concurrency group `discover-rakuten-products`
- `cancel-in-progress: true`
- 失敗時のみActionをfailedにする

既存の楽天価格同期はそのまま維持する。

### 12. 安全設計

- API/Secretsをブラウザへ露出しない
- アフィリエイト率はランキング・品質判定に使わない
- 未確認スペックを自動推測しない
- 既存の編集済み30商品を書き換えない
- 発掘処理失敗時は最後に成功したJSONを保持する
- 0件取得でも既存候補/公開商品を消さない
- 候補が消えた場合は即削除せずstale化する

### 13. テスト

- アクセサリ/セット/中古を除外
- trusted brand検出
- 重複itemCode除外
- qualityScore計算
- auto-publish境界 (review 4.0 / 10件 / score 80)
- affiliateRateが品質スコアへ影響しない
- 0件API結果でも既存公開商品を保持
- 商品一覧に自動発掘セクションが存在
- 自動発掘商品に独自評価・比較ボタンがない

## 成功条件

- 毎日自動で新商品候補が蓄積される
- 高信頼商品だけ自動公開される
- 公開商品数が30件から継続的に増える
- 未確認の商品仕様をサイト上で断定しない
- 既存30商品の診断・比較品質を落とさない
