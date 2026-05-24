/**
 * Nuxt UI v4 のテーマ上書き。
 * UButton の primary 配色をデザインガイド §5.1 に合わせて teal-700 / teal-800 / teal-50 で強制する。
 * (Nuxt UI のデフォルトは bg-primary = --ui-color-primary-500 を使うため、別レイヤで上書きが必要)
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'teal',
      neutral: 'neutral',
    },
    button: {
      compoundVariants: [
        {
          color: 'primary',
          variant: 'solid',
          class: 'text-white bg-teal-700 hover:bg-teal-800 active:bg-teal-800 disabled:bg-teal-700 aria-disabled:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700',
        },
        {
          color: 'primary',
          variant: 'outline',
          class: 'ring ring-inset ring-teal-700 text-teal-700 bg-transparent hover:bg-teal-50 active:bg-teal-50 disabled:bg-transparent aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-700',
        },
      ],
    },
  },
})
