<template>
  <div
    @click="$emit('click')"
    class="group relative rounded-xl shadow-md cursor-pointer transition-all duration-300 hover:-translate-y-1 p-3"
    :style="{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      borderTop: `3px solid ${getColorClass(color)}`
    }"
    @mouseover="$event.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'"
    @mouseleave="$event.currentTarget.style.boxShadow = ''"
  >
    <!-- Background Gradient Overlay -->
    <div
      :class="['absolute inset-0 rounded-xl opacity-0 group-hover:opacity-5 transition-opacity', `bg-${color}-500`]"
    />

    <!-- Content -->
    <div class="relative z-10">

      <!-- Icon -->
      <div
        class="w-8 h-8 rounded-lg mb-2 flex items-center justify-center"
        :class="iconClass()"
      >
        <component :is="iconComponent" :class="['w-5 h-5', `text-${color}-600`]" />
      </div>

      <!-- Title -->
      <h3
        class="text-sm font-semibold mb-1 transition-colors"
        :style="{ color: 'var(--text-main)' }"
      >
        {{ title }}
      </h3>

      <!-- Description -->
      <p class="text-xs mb-2" :style="{ color: 'var(--text-muted)' }">
        {{ description }}
      </p>

      <!-- Footer -->
      <div class="flex items-center justify-between">
        <div class="text-xs" :style="{ color: 'var(--text-muted)' }">Click to open</div>
        <ArrowRight
          class="w-4 h-4 transform group-hover:translate-x-1 transition-all"
          :style="{ color: 'var(--text-muted)' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import ScannerIcon from '@/components/icons/ScannerIcon.svg'
import * as Icons from 'lucide-vue-next'

console.log('Icon initialized:', Icons['Search'], typeof Icons['Search'], typeof Icons)

// 1- add new icon ScannerIcon to the Icons object lucide-vue-next

const IconsExtended = { ...Icons, ScannerIcon }

console.log('Extended Icons:', Object.keys(IconsExtended))
  const props = defineProps({
        title: {type: String, required: true},
        description: {type: String, required: true},
        icon: {type: String, required: true },
        color: { type: String, default: 'blue', validator: (value) => ['blue', 'purple', 'green', 'indigo', 'orange', 'cyan', 'gray'].includes(value)}
      })
   const emit = defineEmits(['click'])
   const settingsStore = useSettingsStore()

  // ─── Theme ────────────────────────────────────────────────────────────────────
const settings = computed(() => settingsStore.settings)
const isDark    = computed(() => settings.value?.appearance?.theme !== 'light')
const iconComponent = computed(() => IconsExtended[props.icon])

const iconClass = () => {

const colorClasses = {
    info: 'bg-[rgba(6,182,212,0.12)] text-[#22d3ee]',
    success: 'bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
    warning: 'bg-[rgba(180,83,9,0.12)] text-[#f59e0b]',
    purple: 'bg-[rgba(168,85,247,0.12)] text-[#c084fc]',
    gray: 'bg-[rgba(148,163,184,0.12)] text-[#94a3b8]',

    blue: 'bg-[rgba(59,130,246,0.12)] text-[#60a5fa]',
    red: 'bg-[rgba(239,68,68,0.12)] text-[#f87171]',
    green: 'bg-[rgba(34,197,94,0.12)] text-[#4ade80]',
    }

return colorClasses[props.color] || colorClasses.gray
}


const getColorClass = (color) => {
  const colors = {
    blue: '#0ea5e9',
    purple: '#a855f7',
    green: '#10b981',
    indigo: '#6366f1',
    orange: '#f97316',
    cyan: '#06b6d4',
    gray:  '#6b7280',
    red: '#ef4444',
  }
  return colors[color] || colors.blue
}

</script>

<style scoped>

/* Cards */
.cart-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  backdrop-filter: blur(12px);
  transition: background 0.4s, border-color 0.4s;
}
/* Smooth transitions */
transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>


