<template>
  <div>
    <header
      class="mx-3 mt-1 sticky top-0 z-10 rounded-xl shadow-sm"
      :style="{
        background: 'var(--card-bg)',
        borderBottom: '1px solid var(--card-border)'
      }"
    >
      <div class="px-4 py-3 flex justify-between items-center">
        <div class="flex items-center gap-3">
          <component :is="iconComponent" :style="{color: primaryColor}" />
          <h1 class="text-lg font-bold" :style="{ color: 'var(--text-main)' }">
            {{ pageTitle }}
          </h1>
        </div>
      </div>
    </header>
  </div>
</template>

<script setup>
import {computed} from 'vue'
import { useSettingsStore } from '@/stores/settings'
import InvoiceLogo from '@/components/icons/InvoiceIcon.svg'
import SaveIcon from "@/components/icons/SaveIcon.svg";
import ArchiveIcon from '@/components/icons/ArchiveIcon.svg'

import {
  Users,
  User,
  Clock,
  Calendar,
  AlertCircle,
  CheckSquare,
  TrendingUp,
  BarChart3,
  DollarSign,
  Layers,
  AlertTriangle
} from 'lucide-vue-next'

const primaryColor = computed(() => settings.value?.appearance?.primaryColor || '#06b6d4')
const props = defineProps({
        pageTitle: { type: String, required: true },
        icon:      { type: String, default: 'BarChart3' },
        color:     { type: String, default: 'red' },
    })

const iconComponent = computed(() => {
    const icons = {
        TrendingUp,
        Calendar,
        BarChart3,
        DollarSign,
        Layers,
        AlertCircle,
        InvoiceLogo,
        Users,
        User,
        Clock,
        CheckSquare,
        AlertTriangle,
        SaveIcon,
        ArchiveIcon
    }
  return icons[props.icon] || BarChart3
  })


const settingsStore = useSettingsStore()
    console.log("props.color", props.color)
// ─── Theme ────────────────────────────────────────────────────────────────────
const settings = computed(() => settingsStore.settings)
const isDark    = computed(() => settings.value?.appearance?.theme !== 'light')


</script>
