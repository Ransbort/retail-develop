<template>
  <div class="sticky top-0 z-0 flex px-2 flex-row gap-2">
    <!-- Mode Toggle Button -->
    <div
      @click="switchMode()"
      class="absolute left-5 top-3 px-2 py-2 rounded-full text-white z-10 transition-colors duration-200 cursor-pointer"
      :class="{
        'animate-pulse': isScannerMode,
        'bg-slate-400': !isScannerMode,
        'bg-red-500': isLoading
      }"
      :style="(isScannerMode && !isLoading) ? { backgroundColor: primaryColor } : {}"
      :title="getStatusTitle()"
    >
      <BarcodeScannerIcon v-if="isScannerMode" class="w-5 h-5" />
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        class="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
    <!-- Loading Indicator -->
    <div v-if="isLoading" class="absolute right-5 top-3 px-2 py-2">
      <div class="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full"></div>
    </div>

    <!-- Results Count -->
    <div
      v-else-if="showResultsCount && modelValue && resultsCount !== null && !isScannerMode"
      class="absolute right-5 top-2 bg-cyan-100 text-cyan-800 text-xs px-2 py-1 rounded-full"
    >
      {{ resultsCount }} {{ resultsCount === 1 ? 'result' : 'results' }}
    </div>

    <!-- Barcode Mode Indicator -->
    <div
      v-else-if="isScannerMode"
      class="absolute right-5 top-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 animate-pulse"
    >
      <span class="w-2 h-2 bg-green-600 rounded-full"></span>
      {{ __('Scanner Mode') }}
    </div>

    <!-- Clear Button -->
    <button
      v-if="modelValue && modelValue.length > 0"
      class="absolute right-5 top-3 p-2 text-gray-400 hover:text-gray-600 transition-colors duration-200"
      @click="clearSearch"
      type="button"
      title="Clear search"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <input
      ref="mainInput"
      type="text"
      :value="modelValue"
      class="rounded-3xl shadow text-lg w-full h-16 py-4 pl-16 pr-12 transition-all duration-300 focus:outline-none"
      :style="{
        backgroundColor: 'var(--input-bg)',
        color: 'var(--input-text)',
        borderColor: 'var(--input-border)',
        boxShadow: 'var(--input-shadow)',
      }"
      autocomplete="off"
      :placeholder="__(currentPlaceholder)"
      @input="handleInput"
      @keydown="handleKeydown"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useShiftStore } from '../stores/shift'
import { useSettingsStore } from '../stores/settings'
import { useCartStore } from '@/stores/cart'
import { __ } from '@/i18n/index'
import BarcodeScannerIcon from '@/components/icons/BarcodeScanner.svg'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: __('Search by product name or barcode')
  },
  showResultsCount: {
    type: Boolean,
    default: false
  },
  resultsCount: {
    type: Number,
    default: null
  },
  autofocus: {
    type: Boolean,
    default: true
  }
})
const emit = defineEmits(['update:modelValue', 'search', 'clear', 'enter', 'barcode-detected'])

const mainInput = ref(null)
const isLoading = ref(false)
const isProcessingBarcode = ref(false)

// Stores
const shiftStore = useShiftStore()
const cartStore = useCartStore()
const settingsStore = useSettingsStore()

const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => settings.value?.appearance?.primaryColor || '#06b6d4')

const isScannerMode = ref(false)

const currentPlaceholder = computed(() => {
  if (isScannerMode.value) {
    return 'Turn on scanner'
  }
  return props.placeholder || 'Search by product name Serial No Barcode.'
})

const getStatusTitle = () => {
  return isScannerMode.value ? __('Scanner Mode') : __('Manual Mode')
}

const switchMode = () => {
  isScannerMode.value = !isScannerMode.value

  if (window.$toast) {
    window.$toast.info(
      isScannerMode.value
        ? __('Scanner Mode Activated')
        : __('Manual Mode Activated')
    )
  }

  nextTick(() => {
    if (mainInput.value) {
      mainInput.value.focus()
    }
  })
}

const handleBarcodeDetected = async (barcodeData) => {
  if (isProcessingBarcode.value) return
  isProcessingBarcode.value = true
  isLoading.value = true

  try {
    const { barcode } = barcodeData

    if (!shiftStore.isShiftOpen) {
      window.$toast?.warning(__('Please open the POS first'))
      return
    }

    const response = await shiftStore.getItemsFromFrappeDB(
      shiftStore.pos_profile,
      shiftStore.pos_profile?.selling_price_list,
      null,
      barcode
    )

    const items = response?.items ?? (Array.isArray(response) ? response : [])
    const searchContext = response?.search_context || {}

    if (items.length > 0) {
      const product = items[0]
      const selectedUom = searchContext.uom || product.stock_uom

      cartStore.addToCart({
        ...product,
        uom: selectedUom,
        rate: product.uom_prices?.[selectedUom]?.rate || product.rate,
        conversion_factor: product.uom_prices?.[selectedUom]?.conversion_factor || 1,
        barcode: searchContext.barcode || '',
      })

      window.$toast?.success(`${product.item_name}`)
    } else {
      window.$toast?.error(__('Product {0} not found', { 0: barcode }))
    }
  } catch (error) {
    console.error('❌ Error processing barcode:', error)
    window.$toast?.error(__('Error processing barcode'))
  } finally {
    isLoading.value = false
    isProcessingBarcode.value = false
    emit('update:modelValue', '')
  }
}

const handleInput = (event) => {
  const value = event.target.value
  emit('update:modelValue', value)
}

const handleKeydown = async (event) => {
  if (event.key === 'Escape') {
    emit('update:modelValue', '')
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    const value = event.target.value.trim()

    if (/^\d{8,20}$/.test(value)) {
      await handleBarcodeDetected({
        barcode: value,
        source: isScannerMode.value ? 'scanner' : 'manual'
      })
    } else if (value.length >= 2) {
      emit('enter', value)
    }
  }
}

const clearSearch = () => {
  emit('update:modelValue', '')
  emit('clear')

  nextTick(() => {
    if (mainInput.value) {
      mainInput.value.focus()
    }
  })
}

const focus = () => {
  if (mainInput.value) {
    mainInput.value.focus()
  }
}

defineExpose({ focus })

onMounted(() => {
  if (mainInput.value && props.autofocus) {
    nextTick(() => {
      mainInput.value.focus()
    })
  }
})
</script>

<style scoped>
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
