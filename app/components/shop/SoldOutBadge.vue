<script setup lang="ts">
withDefaults(
  defineProps<{
    /** ラベルのサイズ。'card' = 商品カード用 (小)、'detail' = 商品詳細用 (大) */
    size?: 'card' | 'detail'
  }>(),
  { size: 'card' },
)
</script>

<template>
  <div
    class="pointer-events-none absolute inset-0 flex items-center justify-center bg-neutral-900/55"
    role="img"
    aria-label="SOLD OUT"
  >
    <span
      class="font-en rounded bg-white font-bold tracking-widest text-neutral-900 uppercase"
      :class="size === 'detail' ? 'px-5 py-2 text-h3' : 'px-3 py-1 text-caption'"
    >
      SOLD OUT
    </span>
  </div>
</template>
