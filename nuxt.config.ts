import process from 'node:process'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/hints',
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxtjs/turnstile',
    '@pinia/nuxt',
    '@sentry/nuxt/module',
    'nuxt-studio',
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

  content: {
    build: {
      markdown: {
        remarkPlugins: {
          'remark-heading-id': {},
        },
      },
    },
  },

  runtimeConfig: {
    notionApiToken: process.env.NOTION_API_TOKEN ?? '',
    notionContactDbId: process.env.NOTION_CONTACT_DB_ID ?? '',
    notionNewsDbId: process.env.NOTION_NEWS_DB_ID ?? '',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    resendAudienceId: process.env.RESEND_AUDIENCE_ID ?? '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    newsletterTokenSecret: process.env.NEWSLETTER_TOKEN_SECRET ?? '',
    newsletterFrom: 'noreply@nango7base.jp',
    contactNotificationTo: 'contact@nango7base.jp',
    contactNotificationFrom: 'noreply@nango7base.jp',
    turnstile: {
      secretKey: '',
    },
    public: {
      siteUrl: 'https://nango7base.jp',
      sentryDsn: '',
      turnstile: {
        siteKey: '',
      },
    },
  },

  sourcemap: {
    client: 'hidden',
  },

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

  studio: {
    repository: {
      provider: 'github',
      owner: '24sk',
      repo: 'n7b',
      branch: 'main',
    },
  },

  turnstile: {
    siteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
  },
})
