<script setup lang="ts">
import type { NewsBlock } from '~~/shared/types/news'

interface GroupedBlock {
  kind: 'block' | 'ul' | 'ol'
  items: NewsBlock[]
}

const props = defineProps<{
  blocks: NewsBlock[]
}>()

const grouped = computed<GroupedBlock[]>(() => {
  const out: GroupedBlock[] = []
  for (const block of props.blocks) {
    if (block.type === 'bulleted_list_item') {
      const last = out.at(-1)
      if (last?.kind === 'ul')
        last.items.push(block)
      else
        out.push({ kind: 'ul', items: [block] })
    }
    else if (block.type === 'numbered_list_item') {
      const last = out.at(-1)
      if (last?.kind === 'ol')
        last.items.push(block)
      else
        out.push({ kind: 'ol', items: [block] })
    }
    else {
      out.push({ kind: 'block', items: [block] })
    }
  }
  return out
})
</script>

<template>
  <div class="space-y-6 text-body-lg leading-relaxed text-neutral-700">
    <template v-for="(group, gIdx) in grouped" :key="gIdx">
      <ul v-if="group.kind === 'ul'" class="ml-6 list-disc space-y-2">
        <li v-for="(b, i) in group.items" :key="i">
          <NewsRichText v-if="b.type === 'bulleted_list_item'" :text="b.text" />
        </li>
      </ul>

      <ol v-else-if="group.kind === 'ol'" class="ml-6 list-decimal space-y-2">
        <li v-for="(b, i) in group.items" :key="i">
          <NewsRichText v-if="b.type === 'numbered_list_item'" :text="b.text" />
        </li>
      </ol>

      <template v-else>
        <template v-for="(b, i) in group.items" :key="i">
          <h2 v-if="b.type === 'heading_1'" class="mt-10 text-h1 font-bold text-neutral-900">
            <NewsRichText :text="b.text" />
          </h2>
          <h3 v-else-if="b.type === 'heading_2'" class="mt-8 text-h2 font-bold text-neutral-900">
            <NewsRichText :text="b.text" />
          </h3>
          <h4 v-else-if="b.type === 'heading_3'" class="mt-6 text-h3 font-bold text-neutral-900">
            <NewsRichText :text="b.text" />
          </h4>
          <p v-else-if="b.type === 'paragraph'">
            <NewsRichText :text="b.text" />
          </p>
          <blockquote
            v-else-if="b.type === 'quote'"
            class="border-l-4 border-teal-700 pl-4 text-neutral-700 italic"
          >
            <NewsRichText :text="b.text" />
          </blockquote>
          <hr v-else-if="b.type === 'divider'" class="my-8 border-neutral-300">
          <figure v-else-if="b.type === 'image'">
            <NuxtImg
              :src="b.url"
              :alt="b.alt"
              loading="lazy"
              class="w-full rounded-md"
            />
            <figcaption v-if="b.alt" class="mt-2 text-caption text-neutral-500">
              {{ b.alt }}
            </figcaption>
          </figure>
          <pre
            v-else-if="b.type === 'code'"
            class="overflow-x-auto rounded-md bg-neutral-900 p-4 text-caption text-white"
          ><code><NewsRichText :text="b.text" /></code></pre>
        </template>
      </template>
    </template>
  </div>
</template>
