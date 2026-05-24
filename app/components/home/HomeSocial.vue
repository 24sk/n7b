<script setup lang="ts">
interface SocialItem {
  label: string
  handle: string
  icon: string
  href: string
}

const socials: SocialItem[] = [
  { label: 'Instagram', handle: '@nango7base', icon: 'i-lucide-instagram', href: '#' },
  { label: 'X (Twitter)', handle: '@nango7base', icon: 'i-lucide-twitter', href: '#' },
  { label: 'YouTube', handle: 'Nango7Base', icon: 'i-lucide-youtube', href: '#' },
]
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm lg:p-8">
    <div class="flex items-start gap-3">
      <span class="flex size-10 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
        <UIcon name="i-lucide-share-2" class="size-5" />
      </span>
      <div>
        <h2 class="text-h3 font-bold text-neutral-900">
          SNS でも発信中
        </h2>
        <p class="mt-1 text-caption text-neutral-700">
          フィールドの記録や制作の途中経過をシェアしています。
        </p>
      </div>
    </div>

    <ul class="flex flex-wrap gap-3">
      <li v-for="social in socials" :key="social.label">
        <a
          :href="social.href"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-caption font-medium text-neutral-700 transition-colors hover:border-teal-600 hover:text-teal-700"
        >
          <UIcon :name="social.icon" class="size-4" />
          <span class="font-en">{{ social.handle }}</span>
        </a>
      </li>
    </ul>
  </div>
</template>
