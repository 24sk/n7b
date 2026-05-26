<script setup lang="ts">
interface Section {
  id: string
  heading: string
  body: string[]
  list?: string[]
}

const sections: Section[] = [
  {
    id: 'scope',
    heading: '適用',
    body: [
      '本利用規約（以下「本規約」といいます）は、内田 剛（屋号：南湖7丁目ベース / N7B、以下「当方」といいます）が運営するウェブサイト nango7base.jp（以下「本サイト」といいます）の利用条件を定めるものです。',
      '本サイトをご利用になる方（以下「利用者」といいます）は、本規約に同意のうえご利用いただくものとします。',
    ],
  },
  {
    id: 'change',
    heading: '本規約の変更',
    body: [
      '当方は、必要と判断した場合、利用者への事前通知なく本規約を変更することができます。変更後の規約は、本サイトに掲載した時点から効力を生じます。',
    ],
  },
  {
    id: 'account',
    heading: '利用者の責任',
    body: [
      '利用者は、自らの責任において本サイトを利用するものとします。',
      'お問い合わせ・商品購入・メールマガジン登録等の際にご提供いただく情報は、正確かつ最新の情報であるものとします。',
    ],
  },
  {
    id: 'prohibited',
    heading: '禁止事項',
    body: [
      '利用者は、本サイトの利用にあたり、以下の行為をしてはなりません。',
    ],
    list: [
      '法令または公序良俗に違反する行為',
      '犯罪行為に関連する行為',
      '当方、他の利用者または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為',
      '本サイトの運営を妨害するおそれのある行為',
      '不正アクセスを試みる行為、ボット等による自動アクセス、過剰な負荷をかける行為',
      '虚偽の情報を登録する行為、他者になりすます行為',
      '本サイトを通じて入手した情報を、当方の事前承諾なく商業目的で利用する行為',
      'その他、当方が不適切と判断する行為',
    ],
  },
  {
    id: 'purchase',
    heading: '商品の購入',
    body: [
      '本サイトを通じた商品の購入は、別途定める「特定商取引法に基づく表記」の内容に従います。',
      '注文の成立、配送、返品・交換、決済等の条件はそちらをご参照ください。',
    ],
  },
  {
    id: 'ip',
    heading: '知的財産権',
    body: [
      '本サイトに掲載されている文章、画像、ロゴ、デザイン、ソースコードその他一切のコンテンツに関する著作権、商標権その他の知的財産権は、当方または正当な権利者に帰属します。',
      '利用者は、当方の事前の書面による承諾なく、これらのコンテンツを複製、転載、改変、配布等してはなりません。',
    ],
  },
  {
    id: 'service-suspension',
    heading: 'サービスの提供の停止等',
    body: [
      '当方は、以下のいずれかに該当する場合、利用者への事前通知なく、本サイトの全部または一部の提供を停止または中断することができます。',
    ],
    list: [
      '本サイトの保守点検または更新を行う場合',
      '地震、落雷、火災、停電、天災等の不可抗力により本サイトの提供が困難となった場合',
      '通信回線等が事故により停止した場合',
      'その他、当方が本サイトの提供が困難と判断した場合',
    ],
  },
  {
    id: 'disclaimer',
    heading: '免責事項',
    body: [
      '当方は、本サイトに掲載する情報の正確性・完全性・有用性について、合理的な範囲で配慮しますが、これを保証するものではありません。',
      '本サイトの利用に起因または関連して利用者に発生したいかなる損害についても、当方の故意または重大な過失による場合を除き、当方は責任を負いません。',
      '当方と利用者との間で本サイトに関して紛争が生じた場合、当方と利用者との間で誠意をもって解決するものとします。',
    ],
  },
  {
    id: 'governing-law',
    heading: '準拠法・管轄',
    body: [
      '本規約の解釈にあたっては、日本法を準拠法とします。',
      '本サイトに関して紛争が生じた場合、当方の所在地を管轄する裁判所を専属的合意管轄裁判所とします。',
    ],
  },
]

usePageSeo({
  title: '利用規約',
  description:
    '南湖7丁目ベース（N7B）の利用規約です。本サイトのご利用条件、禁止事項、知的財産権、免責事項等について記載しています。',
  path: '/legal/terms',
})
</script>

<template>
  <div>
    <section class="bg-white">
      <div class="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <p class="font-en text-caption font-medium tracking-widest text-teal-700 uppercase">
            Terms of Service
          </p>
          <h1 class="mt-4 text-h1 font-bold leading-tight text-neutral-900">
            利用規約
          </h1>
          <p class="mt-6 text-body leading-relaxed text-neutral-700">
            南湖7丁目ベース（N7B）のウェブサイト nango7base.jp をご利用いただく際の条件を定めています。
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
              第{{ index + 1 }}条  {{ section.heading }}
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
