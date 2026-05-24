# N7B プロジェクト規約

南湖7丁目ベース (Nanako7Base / N7B) の Web サイト。Nuxt 4 + TypeScript + Nuxt UI v4。

## 参照ドキュメント (自動読み込み)

- @docs/ロードマップ.md — フェーズ計画
- @docs/技術スタック.md — 採用技術
- @docs/タスク.md — 実装可能な最小単位のタスクリスト
- @docs/デザインガイドライン.md — カラー / タイポ / コンポーネント / トーン

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

## サーバ実装規約

- API ルートは `server/api/*.{get,post,put,delete}.ts`
- 入力検証は **Zod** で `getValidatedQuery` / `readValidatedBody`
- 自動化処理は **n8n 等を使わず Nuxt server route 内で直接実装** (@docs/タスク.md 冒頭の方針メモ参照)

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
