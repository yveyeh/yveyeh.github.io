<script setup>
/**
 * Google-style "apps" launcher: a nine-dot floating action button that toggles
 * a pane listing the social handles in a 3x3 grid.
 */
import { ref, onMounted, onBeforeUnmount } from 'vue'
import BrandIcon from './BrandIcon.vue'
import { socials } from '../data/socials.js'

const open = ref(false)
const root = ref(null)
const toggle = () => (open.value = !open.value)
const close = () => (open.value = false)

const onPointerDown = (e) => {
  if (open.value && root.value && !root.value.contains(e.target)) close()
}
const onKeydown = (e) => {
  if (e.key === 'Escape') close()
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <div ref="root" class="fixed top-4 right-4 z-50 sm:top-6 sm:right-6">
    <!-- Nine-dot FAB -->
    <button
      id="apps-launcher-toggle"
      type="button"
      aria-haspopup="true"
      :aria-expanded="open"
      aria-controls="apps-launcher-pane"
      aria-label="Connect & Profiles"
      title="Connect & Profiles"
      class="group grid size-12 cursor-pointer place-items-center rounded-full border border-white/20 bg-white/10 text-white shadow-lg shadow-black/30 backdrop-blur-md transition duration-300 hover:scale-105 hover:bg-white/20 focus-visible:ring-4 focus-visible:ring-gold-400/60 focus-visible:outline-none active:scale-95"
      :class="open && 'bg-white/25 ring-2 ring-gold-400/70'"
      @click="toggle"
    >
      <span class="grid grid-cols-3 gap-[3px] transition-transform duration-500" :class="open ? 'rotate-90' : 'group-hover:rotate-45'">
        <span v-for="n in 9" :key="n" class="size-[5px] rounded-full bg-current" />
      </span>
    </button>

    <!-- Apps pane -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 scale-90 -translate-y-2"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-90 -translate-y-2"
    >
      <div
        v-show="open"
        id="apps-launcher-pane"
        role="menu"
        aria-labelledby="apps-launcher-toggle"
        class="absolute top-full right-0 mt-3 w-[min(21rem,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-3xl border border-white/10 bg-white/95 p-3.5 shadow-2xl shadow-black/40 backdrop-blur-xl"
      >
        <div class="flex items-center justify-between px-2 pt-1 pb-2.5">
          <p class="text-xs font-semibold tracking-[0.2em] text-navy-800/70 uppercase">Profiles & Connect</p>
          <span class="rounded-full bg-navy-800/5 px-2 py-0.5 text-[10px] font-medium text-navy-800/60">3 × 3</span>
        </div>
        
        <ul class="grid grid-cols-3 gap-1.5 rounded-2xl bg-slate-100/80 p-2">
          <li v-for="(s, i) in socials" :key="s.id">
            <a
              :id="`social-${s.id}`"
              :href="s.href"
              target="_blank"
              rel="noopener noreferrer"
              role="menuitem"
              class="group flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 text-center transition duration-200 hover:bg-white hover:shadow-md focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-navy-700/40 focus-visible:outline-none"
              :style="{ transitionDelay: open ? `${i * 15}ms` : '0ms' }"
              @click="close"
            >
              <span :class="[s.bg, 'grid size-11 place-items-center rounded-full text-white shadow-sm transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:shadow-lg']">
                <BrandIcon :icon="s.icon" class="size-5" />
              </span>
              <span class="w-full truncate text-[11px] font-medium text-slate-700">{{ s.label }}</span>
            </a>
          </li>
        </ul>

        <div class="mt-2.5 border-t border-slate-200/70 pt-2 px-1">
          <a
            href="/cv/"
            target="_blank"
            rel="noopener noreferrer"
            class="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-medium text-navy-800/80 transition hover:bg-slate-100 hover:text-navy-900"
            @click="close"
          >
            <span>View Curriculum Vitae (CV)</span>
            <span class="text-navy-800/40 group-hover:translate-x-0.5 transition-transform">→</span>
          </a>
        </div>
      </div>
    </Transition>
  </div>
</template>
