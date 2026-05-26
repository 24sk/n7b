<script setup lang="ts">
interface Section {
  id: string
  heading: string
  body: string[]
  list?: string[]
}

const sections: Section[] = [
  {
    id: 'operator',
    heading: '事業者の名称',
    body: [
      '内田 剛（屋号：南湖7丁目ベース / N7B、以下「当方」といいます）',
    ],
  },
  {
    id: 'collect',
    heading: '取得する個人情報',
    body: [
      '当方は、本ウェブサイト（nango7base.jp。以下「本サイト」といいます）の運営にあたり、以下の個人情報を取得することがあります。',
    ],
    list: [
      'お問い合わせ時：氏名、メールアドレス、お問い合わせ内容',
      'メールマガジン購読時：メールアドレス',
      '商品ご購入時：氏名、配送先住所、電話番号、メールアドレス、決済情報（カード番号等の決済情報は当方では保持せず Stripe が処理します）',
      'アクセス時：IPアドレス、ブラウザ情報、Cookie、閲覧履歴等の利用状況に関する情報',
    ],
  },
  {
    id: 'purpose',
    heading: '利用目的',
    body: [
      '取得した個人情報は、以下の目的の範囲内で利用します。',
    ],
    list: [
      'お問い合わせへの対応・返信',
      'メールマガジンの配信および配信解除手続き',
      '商品の販売、発送、代金決済、アフターサービス',
      '商品・サービスに関する重要なお知らせ',
      'サイトの利用状況の分析および品質向上',
      '不正利用の防止、セキュリティの確保',
    ],
  },
  {
    id: 'third-party',
    heading: '個人情報の第三者提供および業務委託',
    body: [
      '当方は、以下の場合を除き、ご本人の同意なく個人情報を第三者に提供しません。',
    ],
    list: [
      '法令に基づく場合',
      '人の生命、身体または財産の保護のために必要がある場合',
      '商品の発送に必要な範囲で、配送業者へ氏名・配送先住所・電話番号を提供する場合',
      '以下の外部サービスへ業務上必要な範囲で情報処理を委託する場合',
    ],
  },
  {
    id: 'processors',
    heading: '業務委託先（外部サービス）',
    body: [
      '本サイトの運営にあたり、以下の外部サービスを利用しています。各サービスの取扱いについては各社のプライバシーポリシーに従います。',
    ],
    list: [
      'Stripe, Inc.（決済処理）',
      'Resend, Inc.（メール配信）',
      'Notion Labs, Inc.（お問い合わせ・受注情報の管理）',
      'Vercel Inc.（ホスティング、アクセス解析）',
      'Cloudflare, Inc.（ドメイン管理、ボット対策 Turnstile）',
      'Functional Software, Inc.（Sentry：エラー監視）',
    ],
  },
  {
    id: 'cookies',
    heading: 'Cookie および類似技術',
    body: [
      '本サイトでは、利用状況の把握およびサービス改善のために Cookie を利用することがあります。Cookie の利用はブラウザの設定により拒否できますが、その場合一部機能が正常に動作しないことがあります。',
      'Vercel Analytics を利用してアクセス状況を集計しています。個人を特定する情報は記録しません。',
    ],
  },
  {
    id: 'security',
    heading: '安全管理措置',
    body: [
      '当方は、個人情報の漏えい、滅失または毀損の防止のため、合理的な安全管理措置を講じます。具体的には、通信の暗号化（HTTPS）、アクセス権限の管理、信頼性のある業務委託先の選定等を行います。',
    ],
  },
  {
    id: 'rights',
    heading: '開示・訂正・削除等のご請求',
    body: [
      'ご本人またはその代理人からの、保有個人データの開示、訂正、追加、削除、利用停止または第三者提供の停止等のご請求には、ご本人を確認できる方法により合理的な範囲で対応します。下記のお問い合わせ先までご連絡ください。',
    ],
  },
  {
    id: 'contact',
    heading: 'お問い合わせ窓口',
    body: [
      '個人情報の取扱いに関するお問い合わせは、以下までお願いいたします。',
      '内田 剛（南湖7丁目ベース / N7B）',
      'メール：contact@nango7base.jp',
    ],
  },
  {
    id: 'revision',
    heading: '本ポリシーの改定',
    body: [
      '本ポリシーの内容は、法令の変更その他必要に応じて改定することがあります。重要な変更がある場合は本サイト上で告知します。',
    ],
  },
]

usePageSeo({
  title: 'プライバシーポリシー',
  description:
    '南湖7丁目ベース（N7B）のプライバシーポリシーです。個人情報の取得・利用目的・第三者提供・安全管理措置等について記載しています。',
  path: '/legal/privacy',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            Privacy Policy
          </p>
          <h1 class="mt-4 text-h1 font-bold leading-tight text-neutral-900">
            プライバシーポリシー
          </h1>
          <p class="mt-6 text-body leading-relaxed text-neutral-700">
            南湖7丁目ベース（N7B）は、本サイトをご利用いただくお客様の個人情報を、以下の方針に基づき適切に取り扱います。
          </p>
          <p class="mt-2 text-caption text-neutral-500">
            最終更新日：2026年5月26日
          </p>
        </div>
      </div>
    </section>

    <section class="bg-neutral-50">
      <div class="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="space-y-12">
          <article
            v-for="(section, index) in sections"
            :id="section.id"
            :key="section.id"
            class="space-y-4"
          >
            <h2 class="text-h3 font-bold text-neutral-900">
              {{ index + 1 }}. {{ section.heading }}
            </h2>
            <div class="space-y-3 text-body leading-relaxed text-neutral-700">
              <p v-for="(paragraph, i) in section.body" :key="i">
                {{ paragraph }}
              </p>
              <ul
                v-if="section.list"
                class="list-disc space-y-2 pl-5 marker:text-teal-700"
              >
                <li v-for="item in section.list" :key="item">
                  {{ item }}
                </li>
              </ul>
            </div>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>
