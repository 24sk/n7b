# N7B 実装タスクリスト

ロードマップと技術スタックに基づき、実装可能な最小単位でタスクを分解した一覧。基本的に上から順に実装する。依存関係がある場合は `依存:` で明示している。

---

## Phase 0: 準備・環境構築（1週間）

### 外部サービス・アカウント準備

- [x] **0-1** ドメイン取得（`nango7base.jp` を Cloudflare Registrar で取得）
- [x] **0-2** GitHub プライベートリポジトリ `n7b` 作成（README / `.gitignore`(Node) / ライセンス設定）
- [x] **0-3** Vercel Pro で `n7b` プロジェクト作成し、GitHub リポジトリと連携  
  依存: 0-2
- [x] **0-4** Vercel にカスタムドメインを設定（DNS レコードを Cloudflare に追加）  
  依存: 0-1, 0-3
- [x] **0-5** Stripe アカウント設定（事業者情報登録、JPY 通貨設定、Konbini 決済有効化、テスト/本番モード確認）
- [x] **0-6** Resend アカウント作成 + 独自ドメイン認証（SPF / DKIM / DMARC を Cloudflare DNS に設定）  
  依存: 0-1
- [x] **0-7** Resend 送信元アドレス `noreply@nango7base.jp` / `contact@nango7base.jp` を準備  
  依存: 0-6
- [x] **0-8** Notion ワークスペースに「N7B」セクション・お問い合わせ管理 DB・お知らせ管理 DB を作成
- [x] **0-9** Notion Integration を作成し API トークン発行、対象 DB に接続権限付与  
  依存: 0-8
- [x] **0-10** Sentry 無料プランで `n7b` プロジェクト作成、DSN 取得

> **方針メモ**: お問い合わせ受付・Stripe Webhook・注文通知などの自動化はコスト/初期スケールを考慮し、外部ワークフロー（n8n 等）を使わず Nuxt の server route 上で直接実装する。
>
> **デザイン実装方針**: ページ・コンポーネントのデザイン実装時は `@docs/デザインカンプ.png` を参照し、レイアウト・余白・配色などをこれに合わせる（細部のトークン定義は `@docs/デザインガイドライン.md`）。
>
> **法的ページ実装方針**: 特定商取引法表記 / プライバシーポリシー / 利用規約は更新頻度が低いため、Nuxt Content ではなく Vue ページ（`app/pages/legal/*.vue`）として実装する。将来的に更新頻度が上がった場合は Nuxt Content への移行を検討する。

### Nuxt 4 プロジェクト初期化

- [x] **0-13** Nuxt 4 プロジェクト初期化（`nuxt@latest` で雛形作成）  
  依存: 0-2
- [x] **0-14** TypeScript の strict 設定（`tsconfig.json` / `nuxt.config.ts`）  
  依存: 0-13
- [x] **0-15** ESLint / Prettier 導入と設定  
  依存: 0-13
- [x] **0-16** `.env.example` に必要な環境変数（Stripe / Resend / Notion / Sentry / Turnstile）を列挙  
  依存: 0-13
- [x] **0-17** GitHub Actions で型チェック・Lint の CI を設定  
  依存: 0-15
- [x] **0-18** Vercel にデプロイし「Welcome to Nuxt」が `nango7base.jp` で表示されることを確認  
  依存: 0-4, 0-13

### 法的ページ（Stripe 本番稼働の前提）

- [x] **0-19** 特定商取引法に基づく表記ページ作成（Vue ページ `app/pages/legal/tokushoho.vue`）  
  依存: 0-13
- [x] **0-20** プライバシーポリシーページ作成（Vue ページ `app/pages/legal/privacy.vue`）  
  依存: 0-13
- [x] **0-21** 利用規約ページ作成（Vue ページ `app/pages/legal/terms.vue`）  
  依存: 0-13
- [x] **0-22** Stripe ダッシュボードに 3 ページの URL を登録し、本番稼働手続きを完了  
  依存: 0-5, 0-19, 0-20, 0-21

---

## Phase 1: 静的サイト公開（2〜3週間）

### Week 1: 基盤実装

- [x] **1-1** Tailwind CSS 導入（Nuxt UI v4 が Tailwind v4 を内蔵するため別モジュール不要）  
  依存: 0-13
- [x] **1-2** デザインガイドラインのブランドカラー（teal / warm yellow 系）を `app/assets/css/main.css` の `@theme` に定義  
  依存: 1-1
- [x] **1-3** 日本語フォント（Noto Sans JP）+ Inter を `@nuxt/fonts` で導入（`font-display: swap` / サブセット化）  
  依存: 1-1
- [x] **1-4** Nuxt UI v4 を採用（CLAUDE.md / 技術スタックに準拠）  
  依存: 1-1
- [x] **1-5** ベースレイアウト（`layouts/default.vue`）作成
- [x] **1-6** Header コンポーネント実装（ロゴ、グローバルナビゲーション）  
  依存: 1-5
- [x] **1-7** Footer コンポーネント実装（リンク、コピーライト、SNS）  
  依存: 1-5
- [x] **1-8** レスポンシブのブレイクポイント設計と動作確認（Tailwind 標準 sm/md/lg/xl/2xl、`lg` でデスクトップ切替）  
  依存: 1-6, 1-7

### Week 2: 主要ページ実装（ハードコード/JSON 仮データ）

- [x] **1-9** トップページ: ヒーローセクション実装
- [x] **1-10** トップページ: 「拠点で生まれたもの」（商品プレビュー、仮データ）  
  依存: 1-9
- [x] **1-11** トップページ: 4 カテゴリ案内セクション  
  依存: 1-9
- [x] **1-12** トップページ: お知らせセクション（仮データ）  
  依存: 1-9
- [x] **1-13** トップページ: メルマガ登録セクション（UI のみ）  
  依存: 1-9
- [x] **1-14** トップページ: SNS リンクセクション  
  依存: 1-9
- [x] **1-15** About ページ実装
- [x] **1-16** Contact ページ UI 実装（フォームバリデーション含む）

### Week 3: コンテンツ運用とお問い合わせ

- [x] **1-17** Nuxt Content v3 導入（Phase 3 の Journal・制作ストーリー用）  
  依存: 0-13
- [x] **1-18** `server/api/news.get.ts` 実装（Notion お知らせ管理 DB から公開済みレコードを取得、ISR キャッシュ 10 分）  
  依存: 0-9
- [x] **1-19** お知らせ一覧ページ実装（Notion API 経由）  
  依存: 1-18
- [x] **1-20** お知らせ詳細ページ実装（Notion ページブロックを取得してレンダリング）  
  依存: 1-18
- [x] **1-21** トップページのお知らせセクションを Notion API と接続  
  依存: 1-12, 1-18
- [x] **1-22** Cloudflare Turnstile 連携（サイトキー/シークレットキー取得、フォームへ組み込み）  
  依存: 1-16
- [x] **1-23** お問い合わせ送信 API ルート (`server/api/contact.post.ts`) 実装（Turnstile 検証 → Notion API でレコード追加 → Resend で Tsuyoshi さんへメール通知 までを直接処理）  
  依存: 0-9, 1-22
- [x] **1-24** お問い合わせ API のエラーハンドリング・リトライ方針整理（Notion 失敗時もメールは送る等、運用上の落ちこぼし対策）  
  依存: 1-23
- [x] **1-25** Sentry 連携（クライアント/サーバ両方）  
  依存: 0-10
- [ ] **1-26** 全ページのレスポンシブ最終確認（モバイル/タブレット/PC）
- [ ] **1-27** Lighthouse スコア計測（Performance / A11y / Best Practices / SEO 各 85 以上）  
  依存: 1-26
- [x] **1-28** メタタグ・OGP 基本設定（`useSeoMeta`）

---

## Phase 2: EC 機能リリース（3〜4週間）

### Week 1: Stripe 商品設計と一覧ページ

- [x] **2-1** Stripe Dashboard で商品マスタ登録（`pnpm product:add` + `pnpm stripe:seed` の登録フロー整備済み。現状 `crochet-bear-nanako` 1 商品が test モードに登録済。残りは画像準備でき次第追加）  
  依存: 0-5
- [x] **2-2** Stripe 商品メタデータの設計（`metadata.slug` / `metadata.category` / `metadata.story_slug` + Price.lookup_key=slug。`scripts/products/*.json` の Zod スキーマで強制）  
  依存: 2-1
- [x] **2-3** Stripe SDK を Nuxt サーバに導入（`server/utils/stripe.ts` + `runtimeConfig.stripeSecretKey`）  
  依存: 0-16, 2-1
- [x] **2-4** `server/api/products.get.ts` 実装（Stripe Products / Prices 取得、`defineCachedFunction` で 10 分キャッシュ + `/api/products/[slug]` も同キャッシュを共有）  
  依存: 2-3
- [x] **2-5** 商品一覧ページ `/shop` 実装（カテゴリフィルタ含む、`?category=` でディープリンク可）  
  依存: 2-4
- [x] **2-6** 商品詳細ページ `/shop/[slug]` 実装（画像ギャラリー、説明、価格、カート追加ボタン UI / Week 2 で機能化）  
  依存: 2-4
- [x] **2-7** トップページの「拠点で生まれたもの」を Stripe 連携に差し替え（`HomeProducts.vue` を `/api/products` 経由に改修）  
  依存: 1-10, 2-4

### Week 2: カート機能

- [x] **2-8** Pinia 導入とカートストア設計（`@pinia/nuxt` + `app/stores/cart.ts`、localStorage 永続化は `app/plugins/cart.client.ts` で `$subscribe` ベース）  
  依存: 0-13
- [x] **2-9** カート追加・数量変更・削除アクション実装（`addItem` / `updateQuantity` / `removeItem` / `clear`）  
  依存: 2-8
- [x] **2-10** カート合計金額計算ロジック（getter `subtotal` + `calcInclusiveTax` で内税方式の内訳算出。配送料は Checkout 連携時に Stripe Tax/配送料設定で算出する想定）  
  依存: 2-9
- [x] **2-11** Header のカートアイコンにバッジ表示（カート内アイテム数、99+ で丸める）  
  依存: 1-6, 2-9
- [x] **2-12** カートページ実装 (`app/pages/cart.vue`、空状態 / 数量ステッパ / 内訳サマリ含む)  
  依存: 2-9, 2-10
- [x] **2-13** 商品詳細ページの「カートに入れる」ボタンと接続（数量ステッパ + `useToast` で「カートを見る」アクション付き通知）  
  依存: 2-6, 2-9

### Week 3: Checkout 統合

- [x] **2-14** `server/api/checkout.post.ts` 実装（Stripe Checkout Session 作成。slug+quantity をサーバで再検証 → 内税 / Konbini / 動的 `shipping_options`）  
  依存: 2-3, 2-12
- [x] **2-15** カートからのリダイレクト型決済導線実装（`app/pages/cart.vue` の「レジに進む」を `/api/checkout` → `navigateTo(external)` に接続）  
  依存: 2-14
- [x] **2-16** Checkout 成功ページ (`/checkout/success`) 実装（`session_id` から `/api/checkout/session` で要約取得し、`paid` 時にカートを `clear()`）  
  依存: 2-14
- [x] **2-17** Checkout キャンセルページ (`/checkout/cancel`) 実装（カート保持で戻れる導線）  
  依存: 2-14
- [x] **2-18** 配送先住所収集設定（`shipping_address_collection.allowed_countries: ['JP']` + `phone_number_collection`）  
  依存: 2-14
- [x] **2-19** コンビニ決済（Konbini）対応設定（`payment_method_types: ['card', 'konbini']` + 期限 3 営業日）  
  依存: 2-14
- [x] **2-20** 消費税対応（Stripe Price を `tax_behavior: 'inclusive'` で登録済みのため内税方式で統一。Stripe Tax は不使用）  
  依存: 2-1, 2-14
- [x] **2-21** `server/api/webhooks/stripe.post.ts` 実装（`readRawBody` + `constructEvent` で署名検証、`checkout.session.completed` / `async_payment_*` / `charge.refunded` の dispatch 基盤のみ。具体処理は Week 4）  
  依存: 2-14

> **送料設計**: 商品マスタに `shippingSize` (ヤマト宅急便規格 60/80/100/120/140/160) を追加。`server/utils/shipping.ts` でカート最大サイズ × 「本州・四国・九州 / 北海道・沖縄」の 2 地域から `shipping_options` を動的生成し、顧客に Checkout 画面で選択させる。料金テーブルは仮値のため、本番切り替え (2-31) 前に確定価格へ更新する。

### Week 4: 注文管理と運用整備

- [ ] **2-22** Notion に注文管理 DB 作成  
  依存: 0-8
- [ ] **2-23** Stripe Webhook ハンドラ内で `checkout.session.completed` を受け、Notion 注文 DB に登録する処理を実装  
  依存: 2-21, 2-22
- [ ] **2-24** Stripe Webhook ハンドラから Resend で顧客に注文確認メールを送信する処理を実装  
  依存: 0-7, 2-23
- [ ] **2-25** Stripe Webhook ハンドラから Tsuyoshi さんへ注文通知（Resend メール or Slack Incoming Webhook）を送信する処理を実装  
  依存: 2-23
- [ ] **2-25b** `charge.refunded` などの返金系イベントを受け、Notion 注文 DB のステータスを更新する処理を実装  
  依存: 2-23
- [ ] **2-26** 返品・キャンセル運用ルールを策定しドキュメント化
- [ ] **2-30** Footer に法的ページへのリンクを追加  
  依存: 1-7, 0-19, 0-20, 0-21
- [ ] **2-31** Stripe を本番モードに切り替え（環境変数差し替え）  
  依存: 0-5, 2-1〜2-25b
- [ ] **2-32** 本番モードで自己決済テスト（少額購入で全フロー検証）  
  依存: 2-31

---

## Phase 3: コンテンツ運用基盤（2〜3週間）

### Week 1: Journal（記事）機能

- [x] **3-1** Nuxt Content の `journal` コレクション設計（タイトル、説明、公開日、カテゴリ、タグ、ヒーロー画像）  
  依存: 1-17
- [x] **3-2** 記事一覧ページ実装  
  依存: 3-1
- [x] **3-3** 記事詳細ページ実装  
  依存: 3-1
- [x] **3-4** カテゴリ別フィルタリング実装  
  依存: 3-2
- [x] **3-5** 関連記事表示ロジック実装  
  依存: 3-3

### Week 2: 制作ストーリー機能

- [ ] **3-6** Nuxt Content の `stories` コレクション設計（商品 slug と紐づくメタデータ）  
  依存: 1-17
- [ ] **3-7** 制作ストーリー一覧ページ実装  
  依存: 3-6
- [ ] **3-8** 制作ストーリー詳細ページ実装  
  依存: 3-6
- [ ] **3-9** Stripe 商品メタデータに `story_slug` を設定  
  依存: 2-2, 3-6
- [ ] **3-10** 商品詳細ページから制作ストーリーへのリンク導線実装  
  依存: 2-6, 3-8, 3-9
- [ ] **3-11** 制作ストーリー詳細ページから購入導線（商品詳細ボタン）実装  
  依存: 3-8, 2-6

### Week 3: メルマガ機能と SEO 整備

- [x] **3-12** メルマガ購読者管理方針を決定（**Resend Audiences** に決定 / ダブルオプトイン採用）
- [x] **3-13** `server/api/newsletter/subscribe.post.ts` 実装（登録 API）  
  依存: 3-12
- [x] **3-14** トップページのメルマガ登録セクションを購読 API と接続  
  依存: 1-13, 3-13
- [x] **3-15** 購読確認メール（ダブルオプトイン）テンプレート設計と送信  
  依存: 0-7, 3-13
- [x] **3-16** 配信解除エンドポイント (`/newsletter/unsubscribe`) 実装  
  依存: 3-12
- [x] **3-17** メルマガ配信用 HTML テンプレート設計
- [x] **3-18** 最初のメルマガ配信テスト（`pnpm newsletter:test` で下書き作成、本送信は Resend Dashboard から）  
  依存: 3-15, 3-17
- [ ] **3-19** 動的 OGP 画像生成（`@vercel/og` 等で記事・商品ページ用）
- [ ] **3-20** 構造化データ（JSON-LD）追加（Article / Product / Organization）
- [ ] **3-21** `sitemap.xml` 自動生成（`@nuxtjs/sitemap`）
- [ ] **3-22** `robots.txt` 設定
- [ ] **3-23** Google Search Console 登録とサイトマップ送信  
  依存: 3-21
- [ ] **3-24** 最初の記事 3 本以上を入稿  
  依存: 3-3
- [ ] **3-25** 各商品に制作ストーリーを紐づけ完了  
  依存: 3-10

---

## Phase 4: 拡張機能（必要に応じて継続）

着手は需要・データドリブン（Vercel Analytics / Stripe / Resend の指標を見て）で判断する。優先順位はロードマップ参照。

- [ ] **4-1** Works セクション充実（制作実績 3 件以上溜まったら）
- [ ] **4-2** Base Camp（Supabase Auth + Stripe Subscription による有料コンテンツ）
- [ ] **4-3** Community 機能（コメント / Discord 連携、月間 500 訪問者超で検討）
- [ ] **4-4** ワークショップ・イベント予約機能
- [ ] **4-5** 多言語化（英語対応）

---

## マイルストーン

- **Week 1 終了**: Phase 0 完了 — 開発環境稼働
- **Week 4 終了**: Phase 1 完了 — サイト公開（商品なし、お問い合わせ可）
- **Week 8 終了**: Phase 2 完了 — EC 稼働（商品販売開始）
- **Week 11 終了**: Phase 3 完了 — 完全な運用基盤完成
