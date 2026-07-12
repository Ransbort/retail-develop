<!-- StatsCard.vue -->
<template>
  <div
    class="rounded-xl p-4 flex items-center gap-4"
    :style="{
      background: 'var(--card-bg)',
      border: '1px solid var(--card-border)'
    }"
  >
    <!-- Icon -->
    <div
      class="p-3 rounded-lg"
      :class="iconClass()"
    >
      <component :is="iconComponent" class="w-5 h-5" />
    </div>

    <!-- Content -->
    <div class="flex flex-col">
      <h3 class="text-sm font-medium" :style="{ color: 'var(--text-sub)' }">
        {{ title }}
      </h3>

      <p class="text-lg font-semibold" :style="{ color: 'var(--text-main)' }">
        {{ value }}
      </p>

      <!-- subtitle -->
      <small v-if="subtitle" :style="{ color: 'var(--text-muted)' }">
        {{ subtitle }}
      </small>
    </div>
  </div>
</template>


<script setup>
import * as Icons from 'lucide-vue-next'
import {computed} from 'vue'
import InvoiceLogo from '@/components/icons/InvoiceIcon.svg'
import { useSettingsStore } from '@/stores/settings'


const props = defineProps({
  title: { type: String, required: true },
  value: { type: [String, Number], default: 0 },
  icon: { type: String, default: 'BarChart3' },
  color: { type: String, default: 'gray' },
  subtitle: String,
})

const settingsStore = useSettingsStore()
// ─── Theme ────────────────────────────────────────────────────────────────────
const settings = computed(() => settingsStore.settings)
const isDark    = computed(() => settings.value?.appearance?.theme !== 'light')
const iconComponent = computed(() => Icons[props.icon])
const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})

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
      orange: 'bg-[rgba(255,165,0,0.12)] text-[#ffa500]',
      pink: 'bg-[rgba(255,0,128,0.12)] text-[#ff0080]',
      primaryColor: primaryColor.value
    }

    return colorClasses[props.color] || colorClasses.gray
  }

</script>
