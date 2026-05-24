<script setup lang="ts">
import type { NewsRichText } from '~~/shared/types/news'

defineProps<{
  text: NewsRichText[]
}>()
</script>

<template>
  <template v-for="(part, idx) in text" :key="idx">
    <a
      v-if="part.href"
      :href="part.href"
      class="text-teal-700 underline transition-colors hover:text-teal-800"
      :class="{
        'font-bold': part.bold,
        'italic': part.italic,
        'line-through': part.strikethrough,
      }"
    >{{ part.text }}</a>
    <code
      v-else-if="part.code"
      class="rounded bg-neutral-100 px-1 py-0.5 font-mono text-[0.9em]"
    >{{ part.text }}</code>
    <span
      v-else
      :class="{
        'font-bold': part.bold,
        'italic': part.italic,
        'underline': part.underline,
        'line-through': part.strikethrough,
      }"
    >{{ part.text }}</span>
  </template>
</template>
