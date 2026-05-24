// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxt/ui',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'ja' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        {
          rel: 'preload',
          href: '/fonts/LINESeedJP_OTF_Eb.woff2',
          as: 'font',
          type: 'font/woff2',
          crossorigin: 'anonymous',
        },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2026-05-24',

  typescript: {
    strict: true,
    typeCheck: false,
  },

  eslint: {
    config: {
      standalone: false,
      nuxt: {
        sortConfigKeys: true,
      },
    },
  },

  fonts: {
    families: [
      { name: 'Noto Sans JP', provider: 'google', weights: [400, 500, 700], subsets: ['japanese', 'latin'] },
    ],
    defaults: {
      preload: true,
    },
  },

  hints: {
    devtools: true,
    features: {
      hydration: true,
      lazyLoad: true,
      webVitals: true,
      thirdPartyScripts: true,
      htmlValidate: true,
    },
  },
})
