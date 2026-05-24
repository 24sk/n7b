import * as Sentry from '@sentry/nuxt'

const config = useRuntimeConfig()
const dsn = config.public.sentryDsn

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.0,
  })
}
