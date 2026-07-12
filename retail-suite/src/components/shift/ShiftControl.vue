<!-- ShiftControl.vue -->
<template>
  <div class="container-navbar">
    <div class="w-full mx-auto px-4 sm:px-6 lg:px-10">
      <div class="grid grid-cols-4 h-16">
        <!-- Shift Status Left Section -->
        <div class="col-span-3 flex items-center justify-center space-x-4">
          <!-- Shift Status Indicator -->
          <div class="flex items-center">
            <div class="relative">
              <div
                class="w-3 h-3 rounded-full"
                :class="shiftStore.isShiftOpen ? 'bg-green-500' : 'bg-gray-400'"
              />
              <div
                v-if="shiftStore.isShiftOpen"
                class="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"
              />
            </div>
            <span class="ml-2 text-sm font-medium" style="color: var(--text-secondary)">
              {{ shiftStore.isShiftOpen ? __('Shift Active') : __('Shift Inactive') }}
            </span>
          </div>

          <!-- Current Shift Info -->
          <div
            v-if="shiftStore.isShiftOpen && currentShift"
            class="hidden sm:flex items-center gap-6 text-sm"
            style="color: var(--text-secondary)"
            dir="ltr"
          >
            <div class="flex items-center gap-1">
              <UserIcon class="w-4 h-4" />
              <span>{{ currentShift.user }}</span>
            </div>
            <div class="flex items-center gap-1">
              <ClockIcon class="w-4 h-4" />
              <span>{{ shiftDuration }}</span>
            </div>
            <div class="flex items-center gap-1">
              <ReceiptIcon class="w-4 h-4" />
              <span>{{ currentShift.transactions.length || 0 }}</span>
              <span>{{ __('Transactions') }}</span>
            </div>
            <div class="flex items-center gap-1">
              <CashIcon class="w-7 h-[1.37rem]" />
              <span class="font-medium text-green-600">{{ formatPrice(currentShift.totalSales || 0) }}</span>
            </div>
          </div>
        </div>

        <!-- Right Section - 25% -->
        <div class="col-span-1 flex items-center justify-center gap-1">

          <!-- Shift Info -->
          <button v-if="shiftStore.isShiftOpen" @click="showShiftInfo = true"
            class="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
            title="Shift Info">
            <Coins class="w-5 h-5" :style="{ color: showShiftInfo ? '#8b5cf6' : '#6b7280' }" />
          </button>

          <!-- Scanner -->
          <button @click="showMobileScan = true"
            class="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110">
            <BarcodeScannerIcon class="w-5 h-5"
              :style="{ color: showMobileScan ? '#8b5cf6' : '#6b7280' }" />
          </button>

          <!-- Close Shift -->
          <button v-if="shiftStore.isShiftOpen" @click="showCloseShiftModal = true"
            class="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 group"
            title="Close Shift">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" class="w-5 h-5 transition-colors duration-200 group-hover:text-red-500"
              :style="{ color: showCloseShiftModal ? 'red' : '#6b7280' }">
              <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </button>

          <!-- Theme Toggle -->
          <button @click="toggleTheme"
            class="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
            :style="{ color: isDark ? '#facc15' : '#6b7280' }"
            title="Toggle Theme">
            <svg v-if="isDark" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
            <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
            </svg>
          </button>

          <!-- Wifi -->
          <button v-if="shiftStore.isShiftOpen" @click="showWifiModal = true"
            class="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
            title="Wifi">
            <Wifi class="w-5 h-5" :style="{ color: wificonnected === 'connected' ? primaryColor : '#6b7280' }" />
          </button>

          <!-- Divider -->
          <div class="h-5 w-px mx-1" style="background: var(--item-border)" />

          <!-- Avatar -->
          <div v-if="shiftStore.isShiftOpen" class="cursor-pointer hover:scale-110 transition-all duration-200">
            <img :src="userAvatar" :alt="userName" class="w-7 h-7 rounded-full object-cover ring-2"
              :style="{ ringColor: primaryColor }" />
          </div>

        </div>

      </div>
    </div>

    <!-- Modals -->
    <OpenShiftModal
      v-if="showOpenShiftModal"
      @close="showOpenShiftModal = false"
      @success="handleShiftOpened"
      @error="handleShiftError"
    />

    <CloseShiftModal
      v-if="showCloseShiftModal"
      @close="showCloseShiftModal = false"
      @success="handleShiftClosed"
      @error="handleShiftError"
    />

    <ShiftInfoModal
      v-if="showShiftInfo"
      :shift="currentShift"
      @close="showShiftInfo = false"
    />
  </div>

  <MobileScanOverlay
  v-model="showMobileScan"
  :on-add-to-cart="handleAddToCart"
  :pos-profile="shiftStore.pos_profile"
  :price-list="productStore.selectedPriceList"
  :warehouse="productStore.selectedWarehouse"
/>

</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Coins, Wifi, FileText } from 'lucide-vue-next'
import { useShiftStore } from '@/stores/shift'
import { useProductsStore } from '@/stores/products'
import MobileScanOverlay from '@/components/MobileScanOverlay.vue'
import OpenShiftModal from '@/components/modals/OpenShiftModal.vue'
import CloseShiftModal from '@/components/modals/CloseShiftModal.vue'
import ShiftInfoModal from '@/components/modals/ShiftInfoModal.vue'
import { formatDuration, formatPrice } from '../../utils/formatters'
import eventBus from '../../utils/eventBus'
import UserIcon   from '@/components/icons/UserIcon.svg'
import ClockIcon    from '@/components/icons/ClockIcon.svg'
import ReceiptIcon            from '@/components/icons/ReceiptIcon.svg'
import CashIcon               from '@/components/icons/CashIcon.svg'
import InfoIcon               from '@/components/icons/InfoIcon.svg'
import PlayIcon               from '@/components/icons/PlayIcon.svg'
import BarcodeScannerIcon     from '@/components/icons/BarcodeScanner.svg'
import { useSettingsStore }   from '@/stores/settings.js'
import { useInvoicesStore }   from '@/stores/invoices'
import { useCartStore }       from '@/stores/cart'
import { useMobileScanSession } from '@/services/useMobileScanSession'
import { isOffline } from '@/db/network'
import { createDocumentResource } from 'frappe-ui'
// Stores
const cartStore = useCartStore()
const shiftStore = useShiftStore()
const settingsStore = useSettingsStore()
const invoicesStore = useInvoicesStore()
const productStore = useProductsStore()

const emit = defineEmits(['shift-opened', 'shift-closed', 'shift-error'])

// Shift Modals
const showOpenShiftModal = ref(false)
const showCloseShiftModal = ref(false)
const showShiftInfo = ref(false)
const shiftDuration = ref('')
const userAvatar = ref('https://ui-avatars.com/api/?name=Ahmed+Reda&background=0D8ABC&color=fff')

const wificonnected = computed(() => isOffline.value ? 'disconnected' : 'connected')

const userName = computed(() => shiftStore.userName)

const showMobileScan = ref(false)

const handleAddToCart = (product) => {
  const added = cartStore.addToCart(product)
  if (!added) {
    window.$toast?.warning(__('Quantity exceeds available stock'))
  }
}

const currentShift = computed(() => shiftStore.currentShift)
const isDark = computed(() => settingsStore.settings.appearance.theme === 'dark')
const primaryColor = computed(() => {
  return settingsStore.settings.value?.appearance?.primaryColor || '#06b6d4';
})

const updateShiftDuration = () => {
  if (shiftStore.isShiftOpen && currentShift.value) {
    const startTime = new Date(currentShift.value.period_start_date)
    const now = new Date()
    shiftDuration.value = formatDuration(startTime, now)
  } else {
    shiftDuration.value = ''
  }
}

const refreshShiftSummary = async () => {
  try {
    if (shiftStore.isShiftOpen && currentShift.value?.name) {
      const summary = await shiftStore.get_shift_summary({ name: currentShift.value.name })
      shiftStore.currentShift.totalSales = summary.total_sales || 0
      shiftStore.currentShift.transactions = summary.transactions || []
    }
  } catch (err) {
    console.error('Failed to refresh shift summary:', err)
  }
}

const handleShiftOpened = (shift) => {
  showOpenShiftModal.value = false
  emit('shift-opened', shift)
  if (window.$toast) {
    window.$toast.success(`Shift opened successfully for ${shift.userName}`)
  }
}

const handleShiftClosed = (shift) => {
  showCloseShiftModal.value = false
  emit('shift-closed', shift)
  if (window.$toast) {
    window.$toast.success('Shift closed successfully')
  }
}

const handleShiftError = (error) => {
  emit('shift-error', error)
  if (window.$toast) {
    window.$toast.error(error.message || 'Shift operation failed')
  }
}
const toggleTheme = () => {
  const newTheme = settingsStore.settings.appearance.theme === 'dark' ? 'light' : 'dark'
  settingsStore.settings.appearance.theme = newTheme
  applyTheme(newTheme)
}
const applyTheme = (theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

onMounted(() => {
  updateShiftDuration()
  eventBus.on('invoice:created', refreshShiftSummary)
})

onUnmounted(() => {
  eventBus.off('invoice:created', refreshShiftSummary)
})

</script>

<style scoped>
.container-navbar {
  background: var(--nav-bg);
  border-bottom: 1px solid var(--card-border);
}

/* Animations */
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.animate-ping {
  animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Button Styles */
button {
  transition: all 0.2s ease;
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  cursor: not-allowed;
}
/* Responsive */
@media (max-width: 640px) {
  .space-x-5 > * + * {
    margin-left: 0.75rem;
  }
}
</style>
