# ウチマモ Premium Refresh Design

## Goal

ウチマモを「無料で作ったアフィリエイトブログ」ではなく、家庭防犯商品を安心して選べる高品質な比較・診断サービスとして完成度を上げる。既存機能を維持しながら、商品固定・比較体験・情報設計・信頼表現・モバイル体験を統一する。

## Design principle

テーマは **Quiet Premium / 安心 × 信頼 × スマート**。

- ベース: オフホワイト、ディープネイビー、スレート
- アクセント: 控えめなアイスブルー
- BEST / 編集部推奨のみウォームゴールドを限定使用
- 過剰なグラデーション、強い影、全要素カード化を避ける
- 高級感は装飾ではなく、余白・階層・一貫性・根拠の見せ方で作る
- PC / tablet / mobile で同じ情報優先度を維持する

## Global UX changes

### Header / navigation

- ロゴ、ナビ、診断CTAの視覚階層を整理
- CTAは濃紺を基本とし、青グラデーション依存を減らす
- mobile bottom navとの役割重複を避ける

### Trust layer

全主要ページで次を一貫して表示できるようにする。

- 「ウチマモ評価」は独自評価であることを明示
- 「楽天市場レビュー」は外部レビューとして分離表示
- 楽天価格・在庫は変動することを明示
- 商品情報の最終確認日を表示
- PR表記・アフィリエイトポリシーへの導線を維持

## Product data and Rakuten pinning

### Fixed product policy

主要商品は `products.json` の `rakuten.itemCode` を固定し、日次同期ではその itemCode を最優先する。

- `itemCode` が設定されている場合はその商品以外へ自動切替しない
- 該当商品が取得不能なら `needs-review` として同期ステータスへ記録
- 検索キーワードによる候補選定は itemCode 未確定の商品だけに使用
- API失敗時は前回キャッシュを保持
- 商品終了や取得不能を「別商品への自動すり替え」で隠さない

### Initial pinned products

現在の正常同期結果を基準に以下を固定する。

- SwitchBot Lock Ultra: `switchbot:10000315`
- SwitchBot Lock Pro: `switchbot:10000121`
- Tapo outdoor battery camera: `tplinkdirect:10001237`
- LTE/4G outdoor camera: `shop-amanotori:10030960`
- Window sensor: `arkham:10001427`
- Solar sensor light: `suparee:10000239`

SwitchBotについてはセット商品のため、商品名・説明側で「セット」と明示し、将来単品を正式採用する場合は itemCode を人間レビュー後に差し替える。自動検索で単品へ勝手に変更しない。

## Home page

既存の「30秒診断」中心Heroは維持する。

改善点:

1. Hero直下に trust strip
   - 工事不要特化
   - 商品情報更新
   - 独自評価基準
   - PR/比較方針
2. 場所カードの記号文字を統一SVGアイコンへ変更
3. PICK UPは `products.slice(0,3)` を廃止
   - 玄関
   - 屋外
   - 窓
   の3用途を固定表示
4. 商品情報の最終確認日を表示
5. 「評価基準を見る」導線を追加
6. 診断CTAは1画面に複数競合させず、主要CTAを明確化

## Product finder

### Filter UX

- filter panelの密度を下げる
- PC: sticky sidebar
- mobile: 上部のコンパクトfilter panel
- 検索件数、現在条件、resetを1つのtoolbarとして整理

### Product cards

- 商品画像の背景・余白を統一
- 右上の単独 `94/100` 表示を廃止
- `ウチマモ評価 94` とラベル付きで表示
- `楽天市場レビュー ★4.6 (1,982)` と外部レビューを明示
- 商品情報確認日を表示
- CTAは「詳細を見る」を主、楽天購入を副または購入意図が高い箇所で主にする
- compare checkboxを単なるcheckboxから「比較に追加」操作へ見せる

### Comparison selection bar

- 選択商品の小さな画像・商品名を表示
- 3件までという制約を視覚化
- remove可能
- mobile bottom navと干渉しない位置

## Product detail

上から以下の順に情報を整理する。

1. breadcrumb
2. 商品画像 / 商品名 / one-line verdict / 購入box
3. 「ウチマモの結論」
4. メリット / 注意点
5. 評価内訳
6. 設置・通信・電源・月額などの仕様
7. 向いている人
8. 代替候補 / 比較導線
9. 診断CTA

購入boxでは以下を明確に分離する。

- 楽天価格
- 楽天市場レビュー
- ショップ名
- 最終確認日
- PR表記

## Compare page

### Desktop / tablet

既存の「横スクロールする巨大table」を廃止する。

構成:

1. Comparison hero
2. Selected product summary cards
   - 画像
   - ブランド
   - 商品名
   - price
   - ウチマモ評価
   - 楽天レビュー
   - purchase CTA
3. Comparison verdict
   - 総合おすすめ
   - 工事不要向け
   - コスト重視
   - 通信/電源制約向け
4. Difference filter
   - 「違いがある項目だけ表示」
5. Grouped comparison matrix
   - 基本情報
   - 設置
   - 電源・通信
   - 維持費
6. product header rowはsticky
7. comparison CTA / diagnosis CTA

### Mobile

- 720px固定tableをやめる
- 比較項目の左ラベルを固定し、商品列のみ横スワイプ可能にする
- 商品名・価格・CTAをsticky product headerとして保持
- 1項目1行の高さを十分確保
- ○/×だけでなく「対応 / 非対応 / 要確認」を文字でも表示

## Diagnosis

質問画面の良い体験は維持。

結果画面を改善する。

- 推奨商品画像
- 「あなた向けの理由」を1〜2行で表示
- 商品ごとの適合度
- 楽天価格・楽天レビュー
- 商品詳細 / 比較追加 / 楽天への導線
- 「なぜこの結果？」説明

## Guide pages

- 記事の冒頭に更新日、結論、対象読者を表示
- 独自評価や商品紹介が含まれる場合はPR/評価方針を明示
- 記事末尾で診断 / 比較 / 関連商品へ自然に接続
- 長文記事は読み物として余白を広くし、商品ページと同じカード密度にしない

## CI / notification policy

メール通知ノイズを減らし、本当に壊れた通知だけ残す。

- 開発用feature branchではPRを最後まで作成しない
- TDDのRED/GREENはローカルまたはPR未作成branchで行う
- Draft PRではCI jobをskip
- Ready for review / non-draft PRでCIを実行
- main pushでは必ずCIを実行
- Rakuten scheduled syncの失敗は本番障害として通知を維持
- concurrencyによる古いrunの自動cancelを維持

## Accessibility / performance

- focus-visibleを全主要interactive elementで確認
- decorative iconは `aria-hidden=true`
- text contrastを維持
- imageにはwidth/heightを指定しCLSを抑制
- 大きなJSフレームワークを追加しない
- Astro + TypeScript + vanilla client JSを維持

## Success criteria

- 主要商品6件が固定itemCodeで日次同期される
- 固定商品が取得不能でも別商品へ自動すり替わらない
- compare pageがmobileで巨大tableの単純横スクロールにならない
- compare selection中の商品が一覧画面で視覚的に分かる
- TOP PICK UPが玄関・屋外・窓の3用途になる
- 独自評価と楽天レビューが全主要商品UIで明確に区別される
- 商品情報の確認日が表示される
- Draft PRの途中失敗メールを出さない
- `pnpm test` と `pnpm build` がGREEN
