---
title: 'Claude Code の並行 worktree が lint を壊した話'
description: 'Claude Code の並行セッションが作る .claude/worktrees/ を ESLint が走査してしまい、リポジトリルートの lint が異常終了した。原因と ignore 設定での直し方を記録する。'
publishedAt: '2026-07-25'
category: '技術'
tags:
  - 'Claude Code'
  - 'ESLint'
  - 'git worktree'
  - 'Nuxt'
  - 'Monorepo'
tier: free
---
## この記事のゴール

Claude Code の並行セッションを使い始めると、リポジトリ直下に `.claude/worktrees/<name>/` という git worktree (Git の作業ディレクトリを複数持てる仕組み) が生まれます。この worktree を放置したままリポジトリルートで `pnpm lint` を走らせると、ESLint がその配下まで舐めに行って異常終了する — という落とし穴を今日踏みました。

この記事では、なぜ ESLint が worktree の中まで入ってしまうのか、そして「lint の ignore と `.gitignore` の両方に `.claude/worktrees/` を足す」という 2 行の修正でどう直るかを、実際に手を動かした流れで残します。同じく Claude Code を並行で回している開発者向けの、短い予防接種のような話です。

## 何が起きたか — exit 2 で lint が死ぬ

現象はシンプルでした。並行セッションが `.claude/worktrees/quizzical/` に作業用の worktree を作った状態で、リポジトリのルートに戻って `pnpm lint` を実行すると、こんなエラーで停止します。

```
Error [ERR_MODULE_NOT_FOUND]:
Cannot find module '.../.claude/worktrees/quizzical/.nuxt/eslint.config.mjs'
```

つまり ESLint が worktree の中に置いてある別の `eslint.config.mjs` を読みに行き、その設定が参照する `.nuxt/eslint.config.mjs` (Nuxt の自動生成ファイル) が worktree 側には存在しない、という二段構えの事故です。

背景を平たく言うと、worktree は「同じリポジトリを別ディレクトリで checkout したもの」なので、中には Nuxt の設定一式が一緒に付いてきます。ただし `.nuxt/` は都度生成される一時ファイル置き場で、依存インストールも `dev` サーバー起動もしていない worktree には存在しません。ESLint 10 は flat config を発見すると素直に読み込みに行くので、そこで転ぶわけです。

## 直し方 — ignore を 2 か所に足す

直接の原因は「ルートの ESLint が worktree の中まで下りていく」ことなので、ignore を明示すれば済みます。修正は 2 か所だけでした。

1 つ目は `eslint.config.mjs` の global ignores。既に `.agents/**` と `docs/**` を除外していたので、同じ流儀で追記します。

```js
ignores: ['.agents/**', 'docs/**', '.claude/worktrees/**']
```

2 つ目は `.gitignore` に `.claude/worktrees/` を追記。もともとローカルの `.git/info/exclude` にだけ同等の行があり、リポジトリ共有の除外にはなっていませんでした。個人のマシンごとに設定していた地雷除去を、チームで共有できる形に格上げしたイメージです。

この 2 行を足してから `pnpm lint` は素通り、テストもグリーン、PR も CI 通過で本番マージまで一気に流れました。

## 学び — 「AI が作る中間ディレクトリ」を最初から除外しておく

今回の学びは、修正内容そのものよりも運用のほうにあります。

Claude Code や類似のエージェントを並行で動かす前提のリポジトリでは、**エージェントが勝手に作る作業ディレクトリ** (今回の `.claude/worktrees/` のような) を、最初から `.gitignore` と各種 lint / typecheck / test の ignore に入れておくのが安全です。人間なら「あ、これは一時的な checkout ね」と読み飛ばしますが、ツールチェーンは指定がなければ律儀に全部見に行きます。

似た話は Nuxt の `.nuxt/`、Next.js の `.next/`、Python の `.venv/` などで昔からあり、要は「生成物 / 作業領域は最初にまとめて締め出す」という古典的な作法の再演です。エージェント時代版として `.claude/worktrees/` (と、ツールによっては `.aider/`, `.cursor/` なども) を一列に並べておくと、後続のセッションが踏まない地雷になります。

## まとめ

- Claude Code の並行 worktree は Nuxt 設定を連れてくるので、ルートの ESLint が誤って走査すると `.nuxt/` 不在で落ちる
- 直し方は `eslint.config.mjs` の ignores と `.gitignore` に `.claude/worktrees/**` を追加する 2 行だけ
- エージェントが作る作業ディレクトリは、生成物と同じ扱いで最初から締め出しておくと事故が減る

次のアクション: 他のリポジトリでも `.claude/worktrees/` が ignore 済みか点検する。
