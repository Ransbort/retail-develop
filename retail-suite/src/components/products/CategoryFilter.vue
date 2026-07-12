<!-- CategoryFilter.vue -->
<template>
  <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
    <!-- All button -->
    <button
      class="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200"
      :style="modelValue === '' ? activeStyle : inactiveStyle"
      @click="emit('update:modelValue', '')"
    >
      {{ __('All Categories') }}
    </button>

    <!-- Category buttons -->
    <button
      v-for="cat in categories"
      :key="cat"
      class="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap"
      :style="modelValue === cat ? activeStyle : inactiveStyle"
      @click="emit('update:modelValue', cat)"
    >
      {{ cat }}
    </button>
  </div>
</template>

<script setup>

import { computed, watch } from 'vue'
import { useProductsStore } from '@/stores/products'
import { useSettingsStore } from '@/stores/settings'
defineProps({
  modelValue: { type: String, default: '' }
})
const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})
const emit = defineEmits(['update:modelValue'])
const productsStore = useProductsStore()
const categories = computed(() => {
  const cats = productsStore.products
    .map(p => p.item_group)
    .filter(Boolean)
  return [...new Set(cats)].sort()
})

const activeStyle = computed(() => ({
  background: primaryColor.value,
  color: '#fff',
  boxShadow: `0 2px 8px ${primaryColor.value}33`
}))

const inactiveStyle = {
  background: 'var(--item-bg)',
  color: 'var(--text-muted)',
  border: '1px solid var(--card-border)'
}

watch(
  () => settingsStore.settings.appearance.primaryColor)
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
</style>
