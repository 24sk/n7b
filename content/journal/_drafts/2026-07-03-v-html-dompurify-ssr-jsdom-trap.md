---
title: 'v-html を DOMPurify で守る。ただし SSR で jsdom が牙を剥いた話'
description: 'Vue の v-html を vue-dompurify-html に置き換えたら Vercel で全ルート 500。isomorphic-dompurify が引き込む jsdom が原因だった。二層防御とライブラリ選定の記録。'
publishedAt: '2026-07-03'
category: '技術'
tags:
  - 'Vue'
  - 'Nuxt'
  - 'セキュリティ'
  - 'DOMPurify'
  - 'Vercel'
tier: free
---
AI が生成した Markdown をブラウザに描画する。よくある処理ですが、ここに `v-html` を素で使うと XSS の入口になります。今日 N7B は Vue の `v-html` を `v-dompurify-html`(DOMPurify でサニタイズしてから挿入するディレクティブ) に置き換え、ルール化し、本番マージまで進めました。ところがデプロイ直後に全ルートが 500。原因は SSR での jsdom 初期化でした。

この記事は、`v-html` を安全側に倒す実装と、Nuxt + Vercel でハマった落とし穴、そして最終的にどう解消したかの記録です。同じ構成を採る人が同じ穴に落ちないようにまとめておきます。

## なぜ v-html + ESLint 無効化コメントではダメか

最初の実装は `markdown-it` の `html: false`(生 HTML を許可しない) だけを頼りにして、`v-html` の警告は `eslint-disable` で黙らせていました。しかしこれは「警告を消しただけ」で、防御が一層しかない状態です。将来 `html: true` に切り替わったり、別経路で HTML 文字列が流れ込んだ瞬間に破綻します。

メタファーで言えば、玄関の鍵は 1 つだけで、しかも「鍵をかけ忘れても警報を鳴らさない」設定にしている状態。鍵を二重にして、警報も生かすのが二層防御の考え方です。

置き換え後の構成はこうなりました。

- 1 層目: `markdown-it` の `html: false` で生 HTML を通さない
- 2 層目: `vue-dompurify-html` の `v-dompurify-html` で描画直前に DOMPurify がサニタイズ

`v-dompurify-html` はディレクティブなので、テンプレート上での見た目は `v-html` とほぼ同じ。書き換えコストが低いのが良いところです。

```vue
<div v-dompurify-html="renderedMarkdown" />
```

これで `onerror` 属性や `javascript:` スキームの href、`<script>` タグは描画時に落ちます。node 側でも DOMPurify 単体テストを流し、危険な入力が確実に除去されることを確認しました。

## Vercel で全ルートが 500 になった

ローカルでは動く、ビルドも通る、CI もグリーン。squash merge して本番反映も success。ところが本番の `/login` を叩くと 500。全ルートが落ちていました。

切り分けは単純です。

- ローカルの本番ビルド (`nuxt build` + `node .output/server`) では 200 が返る
- Phase 2 (この変更前) のデプロイでは正常
- Phase 3 デプロイ直後から全ルート 500

つまり「Vercel の Function 環境でだけ落ちる、プラグイン起因のクラッシュ」です。犯人は `isomorphic-dompurify` が引き込む **jsdom**。Vercel サーバーレスの Function バンドル (依存トレース) が jsdom を実行時に解決できず、プラグイン初期化ごと吹き飛んで SSR が全滅していました。

### 素の dompurify に戻すのが正解

`vue-dompurify-html` のドキュメントを読み直すと、ディレクティブのサニタイズは本来クライアント側 (`mounted`/`updated`) で走ります。SSR 中にサニタイズさせるのは、プラグインに渡した `enableSSRPropsSupport: true` オプションのせいでした。この 1 行が「サーバーでも DOMPurify を呼ぶ = jsdom が要る」という要求を作っていた。

修正はシンプルです。

1. `isomorphic-dompurify` と `jsdom` を外す
2. 素の `dompurify` (3.x、型同梱) を入れる
3. プラグインから `enableSSRPropsSupport` を外し、デフォルト (クライアントのみサニタイズ) に戻す

これで Function バンドルから jsdom が消え、SSR は健全に、サニタイズはブラウザで走る形になりました。

## 学び: 「同型」のライブラリ名にだまされない

`isomorphic-*` という名前は「サーバーでもブラウザでも動く」の意味ですが、それは「サーバーで動かす必要がある場合に助かる」だけであって、動かす必要が無いなら単に重い依存を引き込むだけです。今回のケースでは、そもそも SSR でサニタイズする必要が無かった (初回描画は空、AI 生成文はクライアント側で流れる) のに、`isomorphic-` を選んで jsdom を巻き込んでしまった。

ルール化して `.claude/rules/vue-conventions.md` に「`v-html` 禁止 / `v-dompurify-html` を使う / `markdown.ts` の `html: false` を緩めない」を明文化しました。次に同じ実装をする AI エージェントも人間も、この轍を踏まない設計に寄せます。

## まとめ

- `v-html` は `v-dompurify-html` + `markdown-it html:false` の二層防御に置き換える
- Nuxt + Vercel では `isomorphic-dompurify` の jsdom が SSR で牙を剥く。素の `dompurify` + クライアントサニタイズで足りる
- 判断はルールファイルに残す。次の実装者 (AI 含む) が同じ穴を掘らない

次は、この二層防御を他プロジェクトの Markdown 描画にも横展開する予定です。
