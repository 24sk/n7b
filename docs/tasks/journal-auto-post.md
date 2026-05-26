# 日刊ジャーナル自動投稿システム 実装タスク

毎日 19:00 JST に Claude/Cursor のログとトレンドから技術記事ドラフトを自動生成し、N7B の `content/journal/_drafts/` に投入する仕組みを構築する。詳細設計は `~/.claude-profiles/personal/plans/claude-documents-knowledge-my2ndbrain-a-buzzing-wolf.md` 参照。

## 前提・制約

- **ログを Git にコミットしない** (社内情報含む可能性) — 生成された .md のみが N7B repo に入る
- ドラフト → 人間レビュー → 添削 → 本ディレクトリへ `git mv` → 公開
- macOS launchd でローカル実行 (Mac スリープ中も `pmset` で wake)
- 実装は **A → B → C → D** の順、A は他と独立して PR 化可

---

## A. N7B 側スキーマ・カテゴリ拡張

### A-1. スキーマ拡張

- [x] **AJ-1** `content.config.ts` の `journal.category` enum に `'技術'` を追加
- [x] **AJ-2** `content.config.ts` の `journal.source` を object 形式 `{ include: 'journal/**/*.md', exclude: ['journal/_drafts/**'] }` に変更
- [x] **AJ-3** `content.config.ts` の `journal.schema` に `tier: z.enum(['free', 'paid']).default('free').optional()` を追加 (Phase 4 有料化用の予約フィールド)
- [x] **AJ-4** `shared/types/journal.ts` の `JournalCategory` 型と `journalCategories` 配列に `'技術'` を追加  
  依存: AJ-1

### A-2. デザイントークン (技術カテゴリ用スレート系カラー)

- [x] **AJ-5** `app/assets/css/main.css` の `@theme static` に `--color-category-tech-bg: #DCE3EC` / `--color-category-tech-text: #2D4A6B` を追加
- [x] **AJ-6** `scripts/check-design-tokens.mjs` の `ALLOWED_HEX` に `'#DCE3EC'` / `'#2D4A6B'` を追加  
  依存: AJ-5
- [x] **AJ-7** `app/utils/journal.ts` のカテゴリスタイルマップに `技術: 'bg-category-tech-bg text-category-tech-text'` を追加  
  依存: AJ-5
- [x] **AJ-8** `docs/デザインガイドライン.md` §5.5 のカテゴリ色分けリストに「技術: `#DCE3EC` / `#2D4A6B`」を追記  
  依存: AJ-5

### A-3. ドラフトディレクトリ準備

- [x] **AJ-9** `content/journal/_drafts/.gitkeep` (空ファイル) を作成

### A-4. ローカル動作確認

- [x] **AJ-10** `pnpm dev` で `/journal` に「技術」カテゴリフィルタが表示されることを確認  
  依存: AJ-1, AJ-7
- [x] **AJ-11** `_drafts/sample.md` を一時的に手動配置し、`queryCollection('journal').all()` の結果に含まれないことを確認  
  依存: AJ-2, AJ-9
- [x] **AJ-12** `pnpm check:all` (eslint + BEM + tokens) と `pnpm typecheck` が通ることを確認  
  依存: AJ-6, AJ-7
- [ ] **AJ-13** feature ブランチで PR を出して Vercel Preview で確認 → main へ merge  
  依存: AJ-10, AJ-11, AJ-12

---

## B. My2ndBrain 側 — 記事生成パイプライン

実装場所: `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/`

### B-1. 依存関係と環境変数

- [x] **AJ-14** `package.json` に `fast-xml-parser` を追加 (※ プロジェクトは npm 構成だったため `npm install fast-xml-parser` で導入)
- [x] **AJ-15** `package.json` の `scripts` に `"daily-n7b": "tsx src/index.ts daily-n7b"` を追加
- [x] **AJ-16** `.env.example` に `N7B_REPO_PATH=/Users/tuchida/dev/n7b` / `SLACK_WEBHOOK_URL=` / `OVERWRITE_EXISTING=false` / `N7B_GIT_BRANCH=main` を追加
- [x] **AJ-17** 実 `.env` に `N7B_REPO_PATH` を設定 (Slack Webhook は任意)

### B-2. 共通ユーティリティ切り出し (refactor)

- [x] **AJ-18** 既存 `src/analyze.ts` から `buildConversationSummary` 関数を `src/utils/conversation-summary.ts` に切り出し (8000 字制限は維持)
- [x] **AJ-19** `src/analyze.ts` を切り出した関数を import する形に修正し、既存 `npm run dev` (note.com フロー) が壊れていないことを確認  
  依存: AJ-18

### B-3. トレンド取得モジュール

- [x] **AJ-20** `src/extract/trends.ts` を新規作成、`TrendItem` 型と `extractTrends(targetDate: Date)` の骨格を実装
- [x] **AJ-21** Hacker News API (`https://hacker-news.firebaseio.com/v0/topstories.json` + `/item/{id}.json`) で score 上位 10 件を取得する処理を実装  
  依存: AJ-20
- [x] **AJ-22** Zenn RSS (`https://zenn.dev/feed`) を `fast-xml-parser` でパースし、`Nuxt / Vue / Claude / TypeScript / Vercel` 等のキーワードマッチで上位 5 件を取得  
  依存: AJ-14, AJ-20
- [x] **AJ-23** 失敗時に throw せず空配列を返し warn ログのみ出力する耐性処理を実装  
  依存: AJ-21, AJ-22
- [x] **AJ-24** 単体動作確認 `npx tsx -e "import('./src/extract/trends.ts').then(m => m.extractTrends(new Date()).then(console.log))"` (12 件取得確認)  
  依存: AJ-23

### B-4. N7B 用記事生成

- [x] **AJ-25** `src/analyze-n7b.ts` を新規作成、`N7bArticle` 型 (title/description/slug/category/tags/tier/content/publishedAt) を定義
- [x] **AJ-26** Anthropic SDK Client を `claude-opus-4-7` / `max_tokens: 4096` / `maxRetries: 3` で初期化  
  依存: AJ-25
- [x] **AJ-27** system プロンプト記述: N7B ペルソナ、ですます調、@docs/デザインガイドライン.md §11 ボイス&トーン遵守、AI 表現禁止 (「ぜひ」「効果的に」「活用」「説明します」)、体験ベース  
  依存: AJ-25
- [x] **AJ-28** user プロンプト記述: 会話履歴サマリ + トレンド配列を渡し「今日のログから1つ技術記事として価値あるトピックを選ぶ。トレンドと結びつけてもよい」、PII マスク指示、厳密 JSON 出力指定、H1 含まず・本文 800〜1500 字  
  依存: AJ-27
- [x] **AJ-29** `{"title": null}` 戻り時のスキップ分岐実装  
  依存: AJ-25
- [x] **AJ-30** slug サニタイズ処理 (英数字とハイフンのみ、kebab-case)  
  依存: AJ-25
- [x] **AJ-31** `tier` は LLM 出力に含めず、常に `'free'` 固定でセット  
  依存: AJ-25

### B-5. N7B 同期モジュール (Git 操作)

- [x] **AJ-32** `src/sync-to-n7b.ts` を新規作成、`syncToN7b(article: N7bArticle)` 関数の骨格を実装
- [x] **AJ-33** ファイルパス決定: `${N7B_REPO_PATH}/content/journal/_drafts/${date}-${slug}.md`  
  依存: AJ-32
- [x] **AJ-34** 冪等性: 既存ファイルあり時に slug へ `-2`, `-3` suffix を自動付与する処理 (`OVERWRITE_EXISTING=true` で上書き許可)  
  依存: AJ-33
- [x] **AJ-35** YAML frontmatter 構築 (title/description/publishedAt/category/tags/tier、日本語値はクオート)  
  依存: AJ-32
- [x] **AJ-36** 事前チェック: `git status --porcelain` で未コミット変更があれば abort  
  依存: AJ-32
- [x] **AJ-37** 事前チェック: 現在ブランチが `main` 以外なら abort  
  依存: AJ-32
- [x] **AJ-38** `git pull --rebase origin main` 実行 (失敗時は警告のみで push まで進めない)  
  依存: AJ-36, AJ-37
- [x] **AJ-39** `git add ${file}` (ピンポイント add)、`git commit -m "docs(journal): add draft ${date}-${slug}"`、`git push origin main` を `execFile` で実行 (`exec` は使わない)  
  依存: AJ-35, AJ-38
- [x] **AJ-40** `--no-verify` は使わず、pre-commit / pre-push hook を通すこと  
  依存: AJ-39

### B-6. 通知モジュール

- [x] **AJ-41** `src/notify.ts` を新規作成、`notify(payload)` の骨格を実装
- [x] **AJ-42** macOS 通知: `osascript -e 'display notification "..." with title "N7B"'` を実装  
  依存: AJ-41
- [x] **AJ-43** Slack Incoming Webhook 送信処理 (`SLACK_WEBHOOK_URL` 未設定なら skip)  
  依存: AJ-41
- [x] **AJ-44** 成功 / ネタなし / 失敗の 3 パターンメッセージテンプレート  
  依存: AJ-42, AJ-43

### B-7. オーケストレーター

- [x] **AJ-45** `src/index.ts` に `daily-n7b` サブコマンドを追加 (既存 `extract` / `analyze` / `dev` は温存)
- [x] **AJ-46** ログ抽出 (Claude Code + Cursor) を並列実行、Obsidian `31-note/YYYY/MM/DD/` への保存も維持  
  依存: AJ-45
- [x] **AJ-47** `extractTrends` を並列実行で組み込み  
  依存: AJ-24, AJ-45
- [x] **AJ-48** 会話 0 件の場合は notify して終了する分岐  
  依存: AJ-44, AJ-45
- [x] **AJ-49** `generateN7bArticle` を呼び出し、`null` 戻り時は notify して終了  
  依存: AJ-25〜AJ-31, AJ-48
- [x] **AJ-50** `syncToN7b` を呼び出し、結果を notify  
  依存: AJ-32〜AJ-40, AJ-49
- [x] **AJ-51** `--dry-run` フラグを追加 (sync せず JSON を標準出力)  
  依存: AJ-45
- [x] **AJ-52** すべてのエラーで `exit 0` を保証 (launchd の暴走再実行防止)  
  依存: AJ-50

### B-8. 手動 E2E 動作確認

- [x] **AJ-53** `npm run daily-n7b -- --dry-run 2026-05-26` で JSON 出力確認 — 全フィールド適切、AI 禁止語なし、ですます/体験ベース/H1なし/N7B 一人称遵守、slug が kebab-case でサニタイズ済み (※ 当初 `{"title": null}` の判定が ```json フェンスなしのレスポンスで失敗していたため `extractJsonPayload` で複数形式に対応する修正を追加)  
  依存: AJ-51
- [ ] **AJ-54** `npm run daily-n7b 2026-05-26` で `content/journal/_drafts/2026-05-26-{slug}.md` 生成と自動 commit/push を確認  
  依存: AJ-52
- [ ] **AJ-55** 同日 2 回実行で `-2` suffix が付与されることを確認  
  依存: AJ-34, AJ-54
- [ ] **AJ-56** Slack / macOS 通知が届くことを確認  
  依存: AJ-44, AJ-54

---

## C. スケジューリング — launchd

### C-1. launchd 設定

- [x] **AJ-57** `which node` で `/Users/tuchida/.nodenv/versions/24.12.0/bin/node` を確認、plist の ProgramArguments に反映
- [x] **AJ-58** plist を `scripts/daily-note-post/launchd/jp.nango7base.daily-journal.plist` として作成 (※ 仕様の `~/Library/LaunchAgents/` 直置きではなく、プロジェクト配下に置いて install.sh で配置する方式に変更 — バージョン管理しやすい)  
  依存: AJ-57
- [x] **AJ-59** `~/Library/Logs/daily-journal/` ディレクトリを作成  
  依存: AJ-58
- [x] **AJ-60** インストールヘルパー `scripts/daily-note-post/launchd/install.sh` を作成 (install / uninstall / reinstall / kickstart / status サブコマンド対応、bootstrap / bootout / kickstart のワンライナー化)  
  依存: AJ-58

### C-2. スリープ対応 (要手動: sudo)

- [ ] **AJ-61** `sudo pmset repeat wakeorpoweron MTWRFSU 18:58:00` で毎日 18:58 自動 wake を設定
- [ ] **AJ-62** `pmset -g sched` で wake schedule を確認  
  依存: AJ-61

### C-3. 登録と動作確認 (要手動: launchctl)

- [ ] **AJ-63** `./scripts/daily-note-post/launchd/install.sh install` で登録 (内部で plist コピー + `launchctl bootstrap gui/$(id -u)`)  
  依存: AJ-58
- [ ] **AJ-64** `./scripts/daily-note-post/launchd/install.sh kickstart` で即時実行し、`~/Library/Logs/daily-journal/stdout.log` 出力を確認  
  依存: AJ-63
- [ ] **AJ-65** plist を一時的に近い時刻 (例: 現在時刻+5 分) に書き換えて `install.sh reinstall` し、自動発火を確認 → 19:00 に戻す  
  依存: AJ-63
- [ ] **AJ-66** Mac を 18:55 に sleep させて 18:58 wake → 19:00 ジョブ実行を翌日ログで確認  
  依存: AJ-61, AJ-65

---

## D. 運用整備

### D-1. ドキュメント

- [ ] **AJ-67** ジャーナル公開フロー手順 (添削 → `git mv _drafts/foo.md ../foo.md` → push) を `docs/` 配下に短いメモとして残す
- [ ] **AJ-68** 障害時の確認手順 (`tail ~/Library/Logs/daily-journal/stderr.log` / `launchctl print` / `pmset -g sched`) をメモ化

### D-2. 運用観察 (1 週間)

- [ ] **AJ-69** 初週は毎朝ドラフトを確認し、Anthropic API のコスト・記事品質・タグ精度を記録
- [ ] **AJ-70** AI 表現の混入が見られたら `analyze-n7b.ts` のプロンプト禁止語リストを更新
- [ ] **AJ-71** 1 週間運用後、品質・コスト・運用負荷を評価して `docs/タスク.md` または本ファイルに改善タスクを追記

---

## E. 将来拡張 (今は実装しない)

参考メモ。Phase 4 以降で着手する候補。

- [ ] タグ別ページ (`/journal/tag/{tag-name}`) と一覧ページでのタグクラウド表示
- [ ] 共通中間表現 `Article` 型への抽象化と Qiita / Zenn / note 向け render モジュール
- [ ] `tier: 'paid'` 記事の Supabase Auth + Stripe Subscription による認証ゲート (ロードマップ Phase 4 「Base Camp」)
- [ ] hero 画像の自動生成 (DALL-E / Stable Diffusion など)
- [ ] レビュー添削の CLI 化 (`pnpm publish-journal {slug}` で `_drafts/` → `journal/` 移動と commit テンプレ)
- [ ] 1 日複数本の生成 (`--count 2`)

---

## 関連ファイル

### 変更
- `/Users/tuchida/dev/n7b/content.config.ts`
- `/Users/tuchida/dev/n7b/shared/types/journal.ts`
- `/Users/tuchida/dev/n7b/app/utils/journal.ts`
- `/Users/tuchida/dev/n7b/app/assets/css/main.css`
- `/Users/tuchida/dev/n7b/scripts/check-design-tokens.mjs`
- `/Users/tuchida/dev/n7b/docs/デザインガイドライン.md`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/src/index.ts`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/src/analyze.ts`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/package.json`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/.env.example`

### 新規
- `/Users/tuchida/dev/n7b/content/journal/_drafts/.gitkeep`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/src/extract/trends.ts`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/src/analyze-n7b.ts`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/src/sync-to-n7b.ts`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/src/notify.ts`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/src/utils/conversation-summary.ts`
- `~/Library/LaunchAgents/jp.nango7base.daily-journal.plist`
- `~/Documents/knowledge/My2ndBrain/scripts/daily-note-post/launchd/install.sh`
