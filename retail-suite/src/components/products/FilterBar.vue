<!-- FilterBar.vue -->
<template>
  <div
    class="flex flex-wrap items-center gap-3 px-3 py-2 rounded-2xl"
    :style="{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }"
  >

  <!-- Category Filter -->
    <div class="flex items-center gap-2">
      <!-- Category Filter -->
      <CategoryFilter v-model="selectedCategory" />

      <!-- Reload Button -->
      <button
        class="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 ml-auto"
        :style="{ background: primaryColor, color: '#fff', border: '1px solid var(--card-border)' }"
        :disabled="isLoading"
        @click="emit('reload')"
      >
        <span v-if="isLoading" class="inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span v-else>↻</span>
        <!-- <span>{{ __('Reload') }}</span> -->
      </button>
    </div>
   </div>
</template>

<script setup>

import { ref, onMounted, computed, watch } from 'vue'
import { useProductsStore } from '@/stores/products'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/stores/settings'
import CategoryFilter from './CategoryFilter.vue'

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})

defineProps({
  selectedPriceList: { type: String, default: '' },
  selectedWarehouse: { type: String, default: '' },
  priceLists: { type: Array, default: () => [] },
  warehouses: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false }
})

const emit = defineEmits([
  'update:selectedPriceList',
  'update:selectedWarehouse',
  'update:selectedCategory',
  'reload'
])

// selectedCategory was previously referenced in the template
// (v-model="selectedCategory" on CategoryFilter) without ever being
// declared here - assigning to it would have thrown. It's local state
// (stock-status filter: 'all' | 'in_stock' | 'low_stock' | 'out_of_stock'),
// but it's also emitted upward so ProductGrid.vue can actually use it to
// filter the grid - right now nothing consumes the selection at all.
const selectedCategory = ref('all')

watch(selectedCategory, (val) => {
  emit('update:selectedCategory', val)
})

const selectStyle = {
  background: 'var(--item-bg)',
  color: 'var(--text-main)',
  border: '1px solid var(--card-border)',
  cursor: 'pointer'
}

</script>
