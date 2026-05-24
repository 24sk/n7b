<script setup lang="ts">
interface NavItem {
  label: string
  sublabel: string
  to: string
}

const navItems: NavItem[] = [
  { label: 'About', sublabel: '拠点について', to: '/about' },
  { label: 'Works', sublabel: '制作実績', to: '/works' },
  { label: 'Journal', sublabel: 'ジャーナル', to: '/journal' },
  { label: 'Base Camp', sublabel: '有料コンテンツ', to: '/base-camp' },
  { label: 'Shop', sublabel: '拠点で生まれたもの', to: '/shop' },
  { label: 'Community', sublabel: 'コミュニティ', to: '/community' },
  { label: 'Contact', sublabel: 'お問い合わせ', to: '/contact' },
]

const isMenuOpen = ref(false)

function closeMenu() {
  isMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-neutral-100 bg-white/95 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:h-20 lg:px-8">
      <NuxtLink to="/" class="flex items-center gap-3" aria-label="N7B トップへ">
        <span class="flex items-center gap-1.5">
          <UIcon name="i-lucide-sun" class="size-5 text-accent-yellow lg:size-6" />
          <span class="font-en text-xl font-bold tracking-wide text-teal-700 lg:text-2xl">
            N7B
          </span>
        </span>
        <span class="hidden flex-col leading-tight lg:flex">
          <span class="text-caption font-medium text-neutral-900">南湖7丁目ベース</span>
          <span class="font-en text-[10px] text-neutral-500">Field Lab &amp; Base Camp</span>
        </span>
      </NuxtLink>

      <nav class="hidden lg:block" aria-label="グローバルナビゲーション">
        <ul class="flex items-center gap-7">
          <li v-for="item in navItems" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="group flex flex-col items-center gap-0.5 text-center transition-colors"
            >
              <span class="font-en text-sm font-medium text-neutral-900 group-hover:text-teal-700">
                {{ item.label }}
              </span>
              <span class="text-[10px] leading-none text-neutral-500 group-hover:text-teal-700">
                {{ item.sublabel }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-1">
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-search"
          size="md"
          aria-label="検索"
          class="hidden lg:inline-flex"
        />
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-user"
          size="md"
          aria-label="アカウント"
          class="hidden lg:inline-flex"
        />
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-shopping-bag"
          size="md"
          aria-label="カート"
        />
        <UButton
          variant="ghost"
          color="neutral"
          :icon="isMenuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
          size="md"
          :aria-label="isMenuOpen ? 'メニューを閉じる' : 'メニューを開く'"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-nav"
          class="lg:hidden"
          @click="isMenuOpen = !isMenuOpen"
        />
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="-translate-y-2 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-2 opacity-0"
    >
      <div
        v-if="isMenuOpen"
        id="mobile-nav"
        class="border-t border-neutral-100 bg-white lg:hidden"
      >
        <nav aria-label="モバイルナビゲーション">
          <ul class="mx-auto max-w-7xl px-4 py-4 sm:px-6">
            <li v-for="item in navItems" :key="item.to">
              <NuxtLink
                :to="item.to"
                class="flex items-baseline justify-between gap-4 py-3 transition-colors hover:text-teal-700"
                @click="closeMenu"
              >
                <span class="font-en text-base font-medium text-neutral-900">
                  {{ item.label }}
                </span>
                <span class="text-caption text-neutral-500">
                  {{ item.sublabel }}
                </span>
              </NuxtLink>
            </li>
            <li class="mt-2 flex gap-2 border-t border-neutral-100 pt-4">
              <UButton variant="ghost" color="neutral" icon="i-lucide-search" size="sm">
                検索
              </UButton>
              <UButton variant="ghost" color="neutral" icon="i-lucide-user" size="sm">
                アカウント
              </UButton>
            </li>
          </ul>
        </nav>
      </div>
    </Transition>
  </header>
</template>
