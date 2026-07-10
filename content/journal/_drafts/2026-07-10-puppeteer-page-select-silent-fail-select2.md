---
title: 'Puppeteer の page.select() は静かに嘘をつく'
description: 'PuppeteerからPlaywrightへ移行して発覚した「静かな失敗」の話。select2の非表示selectで旧実装が選択に失敗したままCSVをダウンロードしていた実例を、demo環境での検証ログから振り返る。'
publishedAt: '2026-07-10'
category: '技術'
tags:
  - 'Playwright'
  - 'Puppeteer'
  - 'Claude Code'
  - 'スクレイピング'
  - 'テスト'
tier: free
---
## この記事で分かること

Puppeteer から Playwright へスクレイパーを移行したところ、新実装だけがタイムアウトで落ちる現象に出会いました。原因を掘っていくと、実は **旧 Puppeteer 側が「選択に失敗したまま気づかず動いていた」** という、より深い問題が浮かび上がってきました。

この記事では、`select2` (よくある select 装飾ライブラリ) を使ったフォームで起きた「静かな失敗」の実例を、demo 環境の検証ログから 1 本の物語として書き残します。読み終えたあと、自動化スクリプトの「通っている」を疑う視点が 1 つ増えるはずです。

## 移行して初めて見えた壁

旧実装 (Puppeteer) と新実装 (Playwright) を同じ demo 環境で並走させる parity 検証を回していたときのこと。認証まわりを直したあと、新実装だけが CSV フォーマットの選択でタイムアウトしました。

該当箇所はこういう HTML です。

```html
<select class="select2-offscreen" style="...off-screen...">
  <option value="csv">通常CSV</option>
  <option value="custom_csv_XXX">カスタム</option>
</select>
<span class="select2-container">...見た目のUI...</span>
```

`select2` は元の `<select>` を画面外に退避させ、代わりに装飾された `<span>` を表示します。ユーザーには普通のドロップダウンに見えますが、DOM 的には本物の select は **不可視** です。

ここで挙動が分かれました。

- **Puppeteer の `page.select()`**: 可視性を問わない。画面外の select にもそのまま value を投げる
- **Playwright の `selectOption()`**: actionability チェックが入る。要素が visible になるまで待ち続け、来ないのでタイムアウト

第一感では「Playwright が厳格すぎる」と感じます。旧実装は動いているのだから、新実装も `force: true` で揃えれば良い、と。実際その修正を入れると、エラーメッセージは `not visible` から `did not find some options` に変わりました。

## 本当の犯人は旧実装だった

`did not find some options` — つまり **指定した value の option がそもそも存在しない**。

demo 環境の select を列挙してみると、期待していたカスタムフォーマット (`custom_csv_XXX` のような値) が実在しないことが分かりました。ということは、旧 Puppeteer 版はどうしていたのか。

ここで大事な事実に行き当たります。Puppeteer の `page.select()` は、**存在しない value を渡してもエラーを投げません**。何も選択されないまま、静かに素通りします。

旧実装が落としていた CSV を開いてみたら、案の定「通常CSV」(select のデフォルト選択) のカラム構成でした。指定したはずのカスタムフォーマットは一度も選ばれていなかった、ということです。

喩えるなら、券売機に千円札を入れて特定のボタンを押したつもりが、実は押せておらず「一番左のいちばん安い切符」が出続けていた、という状況です。改札は通れるので誰も気づかない。

## つまずきポイント: モック E2E では絶対に見えない

この欠陥は、ローカルのモック E2E テスト (48 件 + 15 件、全部緑) では 1 件も検出できていませんでした。理由は単純で、モックの HTML は select2 を使わない素の `<select>` で、しかも option の value は仕様書通りに揃えてあるからです。

本物の管理画面と自作モックの差はここに詰まっていました。

- 本物: select2 で本物の select が画面外
- モック: 素の select が普通に表示、option も定義通り
- 本物: option 定義は運用者が随時追加・削除
- モック: 定数と一致

「テストが通っている」は、「モックが想定した範囲内で通っている」でしかない。当たり前の話ですが、Puppeteer の silent fail と組み合わさると、**本番投入まで誰も気づかないバグ** に化けます。今回は移行のタイミングで Playwright の厳格さが炙り出してくれた、という順番でした。

## まとめ

- Puppeteer の `page.select()` は存在しない value でもエラーを出さない。「動いている」ように見えて選択されていない可能性がある
- Playwright への移行は、厳格さゆえに旧実装の silent fail を炙り出すリトマス試験紙になる
- モック E2E は「モックが想定した世界」でしか通らない。本物の DOM 構造と option 定義のドリフトは別レイヤーで検知する必要がある

次は、モック側に select2 パターンと option ドリフトの検知テストを足して、この手の欠陥を CI で捕まえられるようにします。
