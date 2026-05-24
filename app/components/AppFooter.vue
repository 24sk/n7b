<script setup lang="ts">
interface FooterNavItem {
  label: string
  to: string
}

interface SocialItem {
  label: string
  icon: string
  href: string
}

const footerNav: FooterNavItem[] = [
  { label: 'About', to: '/about' },
  { label: 'Works', to: '/works' },
  { label: 'Journal', to: '/journal' },
  { label: 'Base Camp', to: '/base-camp' },
  { label: 'Shop', to: '/shop' },
  { label: 'Community', to: '/community' },
  { label: 'Contact', to: '/contact' },
]

const socials: SocialItem[] = [
  { label: 'Instagram', icon: 'i-lucide-instagram', href: '#' },
  { label: 'X (Twitter)', icon: 'i-lucide-twitter', href: '#' },
  { label: 'YouTube', icon: 'i-lucide-youtube', href: '#' },
]

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="bg-teal-900 text-white">
    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div class="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
        <NuxtLink to="/" class="flex items-center gap-3" aria-label="N7B トップへ">
          <span class="flex items-center gap-1.5">
            <UIcon name="i-lucide-sun" class="size-6 text-accent-yellow" />
            <span class="font-en text-2xl font-bold tracking-wide">N7B</span>
          </span>
          <span class="flex flex-col leading-tight">
            <span class="text-caption font-medium">南湖7丁目ベース</span>
            <span class="font-en text-[10px] text-white/70">Field Lab &amp; Base Camp</span>
          </span>
        </NuxtLink>

        <nav aria-label="フッターナビゲーション" class="flex-1 lg:px-8">
          <ul class="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:flex lg:flex-wrap lg:justify-center lg:gap-x-7 lg:gap-y-3">
            <li v-for="item in footerNav" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="font-en text-sm font-medium text-white/90 transition-colors hover:text-accent-yellow"
              >
                {{ item.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <ul class="flex items-center gap-3" aria-label="SNS">
          <li v-for="social in socials" :key="social.label">
            <a
              :href="social.href"
              target="_blank"
              rel="noopener noreferrer"
              :aria-label="social.label"
              class="flex size-9 items-center justify-center rounded-full border border-white/20 text-white/90 transition-colors hover:border-accent-yellow hover:text-accent-yellow"
            >
              <UIcon :name="social.icon" class="size-4" />
            </a>
          </li>
        </ul>
      </div>

      <div class="mt-12 border-t border-white/10 pt-6 text-center text-caption text-white/70">
        © {{ currentYear }} Nanako7Base. All Rights Reserved.
      </div>
    </div>
  </footer>
</template>
