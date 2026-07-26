---
title: 'AI SDK の generateImage で記事画像を自動生成する'
description: 'MCP 経由で投稿する記事のサムネイルとセクション画像を AI SDK の generateImage で自動生成する仕組みを組み込んだ日のログ。camelCase の落とし穴と rebase 衝突までを記録します。'
publishedAt: '2026-07-26'
category: '技術'
tags:
  - 'Claude Code'
  - 'Vercel AI SDK'
  - 'Nuxt'
  - 'Drizzle'
  - 'MCP'
tier: free
---
## この記事で分かること

記事投稿ツールに「画像もお願い」と一言添えるだけで、サムネイル 1 枚と `##` 見出しごとの解説図が自動で生成されて本文に差し込まれる仕組みを、その日のうちに実装から本番マージまで走らせた記録です。使ったのは Vercel AI SDK の `generateImage`、Nuxt + Drizzle + MCP という構成。読むと以下 3 点が分かります。

- AI SDK v7 の `generateImage` を実運用に組み込むときの API 形状と落とし穴
- サムネイル用カラムを追加するときの安全なマイグレーション手順
- 長時間ブランチが招く rebase 衝突を、どこで踏むかの実例

## generateImage を IO 層に閉じ込める

これまで記事画像は手作業で 1 枚ずつ作っていました。今回は MCP ツール (`upload_knowledge` / `upload_guide` / `edit_article`) に生成オプションを足し、投稿と同時に画像も作られるようにしました。

中核は AI SDK v7 の `generateImage` です。v7 から `experimental_` プレフィックスが外れて正式 API になり、戻り値の `uint8Array` をそのまま Blob ストレージに流せるので、base64 デコードを挟む必要がありません。処理は 3 層に分けました。

- **純関数**: プロンプト構築とセクション解析 (Markdown を `##` で分割してタスク化)
- **IO 層**: `generateImage` 呼び出しと Blob へのアップロード
- **オーケストレータ**: N 枚のタスクを並べて実行し、失敗時にどの画像かを識別

最初、失敗時のインデックスを配列位置から逆算していたのですが、非同期で順序が入れ替わると復元が壊れます。対象名 (「サムネイル」「セクション 2」など) をタスク自体に持たせる形に直しました。エラーメッセージが読める人間の言葉になるだけで、後から追う負荷が段違いです。

## camelCase の 1 文字で 400 KB 削れた

プロンプトが通り、日本語も含めて意図通りの画像が出た時点で「勝った」と思ったのですが、指定したはずの `output_format: 'webp'` が効かず、返ってきたのは 1.28 MB の PNG でした。

ドキュメントと実装を突き合わせて気付いたのは、AI SDK のオプション名は camelCase で `outputFormat` を渡す必要があるという点です。`output_format` (snake_case) はプロバイダの HTTP API 側の名前で、SDK では変換されません。

```ts
const { image } = await generateImage({
  model,
  prompt,
  providerOptions: {
    openai: { outputFormat: 'webp' }, // ← camelCase
  },
});
```

この 1 文字差 (アンダースコアかキャメルか) で 1.28 MB → 865 KB。同じ絵で 3 割強軽くなりました。SDK を挟むときは「オプション名の翻訳層」があることを忘れないように、というのがこの日一番身に沁みた学びです。

## 長生きしたブランチが踏んだ地雷

実装が終わって PR を出したのですが、CI (Lint / Test / Build) が一向に起動しません。GitHub 障害を疑って調べたら、原因はもっと素直で、`mergeable: CONFLICTING` になっていました。`pull_request` イベントのワークフローは、マージコミットが作れないと走らない仕様です。

`main` はこの日 16 コミット進んでおり、しかも他機能が Drizzle のマイグレーション番号 `0032` `0033` を先に使っていました。こちらのブランチも `0032` を切っていたので番号衝突です。rebase 中は「相手側を採用してこちらは破棄」で切り抜け、rebase 完了後に `drizzle-kit generate` を叩き直して番号を振り直しました。マイグレーションはコード上の競合というより「連番リソースの奪い合い」なので、コンフリクトマーカーの解消ではなく再生成が正解です。

もう一つ、preview デプロイは本番 DB を共有して migrate をスキップする設計だったため、追加カラムを参照する新コードが preview では 500 になっていました。本番だけ migrate → build → 配信の順で守られる作りだと確認できたので、PR に注意書きを添えてマージへ進めています。

## つまずきの棚卸し

- `output_format` は snake_case ではなく `outputFormat` (camelCase)。SDK のオプション翻訳を過信しない
- 非同期の失敗特定はインデックスではなくタスク側に「名前」を持たせる
- CI が走らないときは GitHub より先に `mergeable` を疑う。競合していると `pull_request` は発火しない
- Drizzle のマイグレーション番号は連番リソース。rebase 時は解消ではなく再生成

## まとめ

- AI SDK v7 の `generateImage` は `uint8Array` を直接返すので Blob 転送が素直
- オプション名の大小文字と、失敗時の識別子は初手で整えておくと後が楽
- 長生きブランチは CI ではなく `mergeable` から壊れる

次は生成した画像の再利用 (同じ記事の差分編集で 2 度作らない) を仕込みます。
