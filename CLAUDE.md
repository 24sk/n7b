# N7B プロジェクト規約

南湖7丁目ベース (Nango7Base / N7B) の Web サイト。Nuxt 4 + TypeScript + Nuxt UI v4。

## 参照ドキュメント (自動読み込み)

- @docs/ロードマップ.md — フェーズ計画
- @docs/技術スタック.md — 採用技術
- @docs/tasks/tasks.md — 実装可能な最小単位のタスクリスト
- @docs/デザインガイドライン.md — カラー / タイポ / コンポーネント / トーン
- @docs/フロントエンドコーディングガイドライン.md — レイアウトシフト (CLS) 防止など実装ルール

## 設定ファイル (自動読み込み)

- @package.json — スクリプト一覧 (`dev` / `lint` / `typecheck` / `check:bem` / `check:tokens` / `check:all`)
- @lefthook.yml — pre-commit / pre-push フック定義
- @.claude/settings.json — Claude Code フック定義

---

## ディレクトリ構成 (Nuxt 4)

- `app/` — クライアント側 (`app.vue`, `pages/`, `layouts/`, `components/`, `composables/`, `assets/`)
- `server/` — Nitro server route / API / middleware
- `scripts/` — 開発補助 (BEM / デザイントークンチェッカー等)
- `docs/` — 仕様・ガイドライン
- `.claude/` — Claude Code 設定 (`settings.json` + `hooks/`)

---

## コード設計原則

1. **車輪の再開発はしない** — 既存のライブラリ / フレームワーク / プロジェクト内ユーティリティで実現できることを自作しない。実装前に以下の順で既存実装を確認する
   - Nuxt UI v4 のコンポーネント / Composables (`useToast` / `useOverlay` 等)
   - Nuxt / Nitro / Vue の標準機能 (`useFetch` / `useAsyncData` / `useState` / `useRoute` 等)
   - VueUse (`useStorage` / `useDebounceFn` / `useMouse` 等)
   - プロジェクト内の `app/composables/` / `app/utils/` / `shared/`
   - npm エコシステムの定番ライブラリ (Zod / date-fns 等)
   - これらで満たせない場合のみ自作する
2. **単一責任の原則 (SRP)** — 1 コンポーネント / 1 composable / 1 関数 / 1 ファイル / 1 API ルートは 1 つの責務だけを持つ
   - コンポーネントは「表示」と「ロジック」を分離する。ロジックは composable に切り出す
   - server route は 1 エンドポイント = 1 ユースケース。複数の責務 (例: フォーム受付 + 別 DB への書き込み + メール送信) はサービス関数に分解して呼び出す
   - 「〜と〜をする関数」になったら分割する。命名で `and` / 「と」が必要になった時点で SRP 違反のサイン

---

## スタイリング規約

1. **Tailwind ファースト**。ユーティリティクラスで表現する
2. デザイントークンは `app/assets/css/main.css` の `@theme` に集約 (詳細は @docs/デザインガイドライン.md)。**未定義の hex 色は禁止** (`scripts/check-design-tokens.mjs` が検出)
3. `<style lang="scss">` を使うときは **BEM** (`block`, `block__element`, `block--modifier`)。SCSS の入れ子では `&__elem` / `&--mod`
4. デザイントークン追加時は `app/assets/css/main.css` と @docs/デザインガイドライン.md、`scripts/check-design-tokens.mjs` の許可リストを同時更新

---

## Vue / Nuxt UI 規約

1. **Nuxt UI v4 ファースト**。Nuxt UI で表現可能なものは Nuxt UI を使用、不足分のみ `app/components/` に自作
2. SFC ブロック順は **`<script>` → `<template>` → `<style>`** (ESLint `vue/block-order` で強制)
3. Composition API + `<script setup lang="ts">` を標準とする
4. 内部リンクは `<NuxtLink>`、画像は `<NuxtImg>` / `<NuxtPicture>`、時刻は `<NuxtTime>`

---

## パフォーマンス最適化の選び方

症状別に対処の第一候補を決めておく。`@nuxt/hints` モジュール (Nuxt DevTools 内) が `lazyLoad` / `webVitals` / `hydration` 等で違反を検知するので、警告が出た箇所から以下の表で対処を選ぶ。

| 症状                               | 第一候補                                                            | 補足                                                           |
| ---------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| バンドルが重い (未使用静的 import) | `<LazyComponentName>` または `defineAsyncComponent`                 | `@nuxt/hints` の `lazyLoad` が SSR/初期 hydration 未使用を検知 |
| Lazy 化で読み込み中の空白が出る    | `<template #fallback>` + `<USkeleton>`                              | Suspense の fallback スロットでレイアウトシフトを防ぐ          |
| 初期 JS 実行が重い (LCP/INP 悪化)  | `hydrate-on-visible` / `hydrate-on-idle` / `hydrate-on-interaction` | `webVitals` が LCP/INP/CLS を計測。要素別の最適化ヒントを参照  |
| インタラクション不要 (表示のみ)    | `*.server.vue` (Server Component)                                   | クライアント JS をゼロにする。`<NuxtIsland>` も同義            |

決定の優先順位: **Server Component で済むなら最優先 → 遅延 hydration → Lazy import + Skeleton**。すべて `@nuxt/hints` の警告に従って判断し、推測で先回りしない。

レイアウトシフト (CLS) 防止の具体ルールは @docs/フロントエンドコーディングガイドライン.md を参照。

---

## サーバ実装規約

- API ルートは `server/api/*.{get,post,put,delete}.ts`
- 入力検証は **Zod** で `getValidatedQuery` / `readValidatedBody`
- 自動化処理は **n8n 等を使わず Nuxt server route 内で直接実装** (@docs/tasks/tasks.md 冒頭の方針メモ参照)

---

## タスク管理

`docs/tasks/` 配下のドキュメント (例: @docs/tasks/tasks.md) を編集する作業では、**実装・対応が完了したタスクのチェックボックス (`- [ ]` → `- [x]`) を必ず更新する**。タスク本文の修正・追加だけ行ってチェック状態を放置しない。

---

## トーン & ボイス

@docs/デザインガイドライン.md §11 に従う。

---

## 開発フロー

スクリプト定義は @package.json を参照。

### 自動チェック (フック)

| トリガ          | 実行内容                                            | 仕組み                                                                     |
| --------------- | --------------------------------------------------- | -------------------------------------------------------------------------- |
| Edit/Write 直後 | ESLint --fix + (app/ 配下なら) BEM/トークンチェック | @.claude/settings.json の PostToolUse → `.claude/hooks/post-edit-check.sh` |
| `git commit` 前 | ESLint --fix / BEM / デザイントークン (parallel)    | @lefthook.yml の pre-commit                                                |
| `git push` 前   | `nuxt typecheck`                                    | @lefthook.yml の pre-push                                                  |

違反時は exit 2 で Claude にフィードバックを返す。

### デプロイ

- `feature/*` → Vercel Preview / `main` → Vercel Production
- Development 環境は不使用
