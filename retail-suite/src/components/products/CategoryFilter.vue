<!-- CategoryFilter.vue -->
<template>
  <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
    <button
      v-for="filter in filters"
      :key="filter.key"
      class="flex-shrink-0 flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 whitespace-nowrap"
      :style="modelValue === filter.key ? getActiveStyle(filter.key) : inactiveStyle"
      @click="emit('update:modelValue', filter.key)"
    >
      <span>{{ __(filter.label) }}</span>
      <span
        class="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
        :style="modelValue === filter.key
          ? { background: 'rgba(255,255,255,0.25)', color: '#fff' }
          : { background: 'var(--card-border)', color: 'var(--text-main)' }"
      >
        {{ counts[filter.key] }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'

defineProps({
  modelValue: { type: String, default: 'all' } // 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'
})
const emit = defineEmits(['update:modelValue'])

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})

const productsStore = useProductsStore()

// Same cutoff pharmacy_pos.js uses: >10 in stock, 1-10 low stock, <=0 out of stock
const LOW_STOCK_THRESHOLD = 10

const counts = computed(() => {
  const products = productsStore.products || []
  const all = products.length
  const in_stock = products.filter(p => (p.actual_qty || 0) > LOW_STOCK_THRESHOLD).length
  const low_stock = products.filter(p => (p.actual_qty || 0) > 0 && (p.actual_qty || 0) <= LOW_STOCK_THRESHOLD).length
  const out_of_stock = products.filter(p => (p.actual_qty || 0) <= 0).length

  return { all, in_stock, low_stock, out_of_stock }
})

const filters = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In Stock' },
  { key: 'low_stock', label: 'Low Stock' },
  { key: 'out_of_stock', label: 'Out of Stock' }
]

// Per-filter accent colors, matching FilterBar.vue's palette
const accents = {
  all: primaryColor,
  in_stock: '#16a34a',
  low_stock: '#ca8a04',
  out_of_stock: '#dc2626'
}

function getActiveStyle(key) {
  const accent = accents[key].value ?? accents[key]
  return {
    background: accent,
    color: '#fff',
    boxShadow: `0 2px 8px ${accent}33`
  }
}

const inactiveStyle = {
  background: 'var(--item-bg)',
  color: 'var(--text-muted)',
  border: '1px solid var(--card-border)'
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
