<script setup lang="ts">
interface Entry {
  label: string
  value: string
  note?: string
}

const entries: Entry[] = [
  {
    label: '販売業者名',
    value: '内田 剛（屋号：南湖7丁目ベース / N7B）',
  },
  {
    label: '運営責任者',
    value: '内田 剛',
  },
  {
    label: '所在地',
    value: '〒253-0061 神奈川県茅ヶ崎市南湖7-12869-116',
  },
  {
    label: '電話番号',
    value: '請求があった場合に遅滞なく開示します',
    note: 'ご請求の際は下記メールアドレスまでご連絡ください。',
  },
  {
    label: 'メールアドレス',
    value: 'contact@nango7base.jp',
  },
  {
    label: 'ホームページURL',
    value: 'https://nango7base.jp',
  },
  {
    label: '販売価格',
    value: '各商品ページに表示する価格（消費税込）',
  },
  {
    label: '商品代金以外の必要料金',
    value: '送料、コンビニ決済の場合は所定の決済手数料',
    note: '送料は商品・配送先地域に応じて注文画面で計算・表示します。',
  },
  {
    label: 'お支払い方法',
    value: 'クレジットカード決済（Visa / Mastercard / JCB / American Express）、コンビニ決済',
  },
  {
    label: 'お支払い時期',
    value:
      'クレジットカード決済：ご注文確定時にご請求。コンビニ決済：ご注文後、所定の支払期限（おおむね3日以内）までにお支払いください。',
  },
  {
    label: '商品の引渡時期',
    value: 'ご入金確認後、原則3〜7営業日以内に発送します。',
    note: '在庫状況・制作状況によりお時間をいただく場合は、別途ご連絡します。',
  },
  {
    label: '申込みの有効期限',
    value: 'コンビニ決済の場合、所定の支払期限までにお支払いが確認できないご注文はキャンセルとさせていただきます。',
  },
  {
    label: '返品・交換について',
    value:
      'お客様都合による返品：商品到着後7日以内に限り、未開封・未使用の商品のみお受けします。返品送料はお客様のご負担となります。',
    note: '不良品・誤配送の場合：商品到着後7日以内にご連絡ください。当方の負担で交換または返金にて対応します。',
  },
  {
    label: '不良品・キャンセルの連絡先',
    value: 'contact@nango7base.jp',
  },
]

usePageSeo({
  title: '特定商取引法に基づく表記',
  description:
    '南湖7丁目ベース（N7B）における特定商取引法に基づく表記です。販売業者・所在地・お支払い方法・返品ポリシー等を記載しています。',
  path: '/legal/tokushoho',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            Legal Notice
          </p>
          <h1 class="mt-4 text-h1 font-bold leading-tight text-neutral-900">
            特定商取引法に基づく表記
          </h1>
          <p class="mt-6 text-body leading-relaxed text-neutral-700">
            特定商取引に関する法律 第11条（通信販売についての広告）に基づき、以下の事項を表示します。
          </p>
        </div>
      </div>
    </section>

    <section class="bg-neutral-50">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <dl class="divide-y divide-neutral-100 overflow-hidden rounded-lg border border-neutral-100 bg-white">
          <div
            v-for="entry in entries"
            :key="entry.label"
            class="grid gap-3 px-6 py-5 lg:grid-cols-[14rem_1fr] lg:gap-8 lg:px-8 lg:py-6"
          >
            <dt class="text-caption font-medium tracking-wide text-neutral-500">
              {{ entry.label }}
            </dt>
            <dd class="space-y-2 text-body leading-relaxed text-neutral-900">
              <p>{{ entry.value }}</p>
              <p v-if="entry.note" class="text-caption text-neutral-500">
                {{ entry.note }}
              </p>
            </dd>
          </div>
        </dl>
      </div>
    </section>
  </div>
</template>
