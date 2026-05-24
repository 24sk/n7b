// @ts-check
import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  antfu({
    formatters: true,
    vue: true,
    typescript: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    ignores: [
      '.eslintcache',
      '.nuxt/**',
      '.output/**',
      '.vercel/**',
      'dist/**',
      'node_modules/**',
      'public/**',
      'docs/**',
      'README.md',
      '.claude/**',
    ],
  }),
  {
    rules: {
      // N7B: Vue SFC ブロック順序 (script → template → style)
      'vue/block-order': ['error', {
        order: ['script', 'template', 'style'],
      }],
      // 日本語コメント・ファイル名を許容
      'unicorn/filename-case': 'off',
    },
  },
)
