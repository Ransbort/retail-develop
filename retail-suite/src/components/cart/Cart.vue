<!-- Cart.vue – full 3-mode POS cart (sale / draft / return)
     Layout: fixed header (badge + customer/return info)
             scrollable items list (flex-1)
             compact footer (totals + collapsible discount/payments/payment-section)
-->
<template>
  <div
    class="rounded-3xl flex flex-col h-full shadow overflow-hidden"
    :style="{
      backgroundColor: 'var(--cart-bg)',
      borderColor:     'var(--cart-border)',
      boxShadow:       'var(--cart-shadow)',
      color:           'var(--cart-text-primary)',
    }"
  >
    <!-- ══════════════════════════════════════════════════════
         FIXED HEADER
    ═══════════════════════════════════════════════════════ -->
    <div class="flex-shrink-0">

      <!-- Mode badge -->
      <div
        v-if="!cartStore.isSaleMode"
        class="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider"
        :style="{
          color:        modeBadgeColor,
          borderBottom: '1px solid var(--card-border)',
        }"
      >
        <span> <component :is="modeBadgeIcon" v-if="modeBadgeIcon" /> </span>
        <span>{{ modeBadgeLabel }}</span>
        <span
          v-if="cartStore.isDraftMode && cartStore.currentDraftName"
          class="ml-auto opacity-70 normal-case tracking-normal font-normal"
        >
          {{ cartStore.currentDraftName }}
        </span>
      </div>

      <!-- Return mode – collapsible original invoice snapshot -->
      <ReturnInvoicePanel
        v-if="cartStore.isReturnMode && cartStore.returnInvoiceData"
        :invoice="cartStore.returnInvoiceData"
        @clear="handleClearReturnInvoice"
      />

      <!-- Cart header row (icon + count + clear) -->
      <div
        v-if="cartStore.cart.length > 0"
        class="h-12 flex items-center px-4"
        :style="{ borderBottom: '1px solid var(--card-border)' }"
      >
        <div class="relative">
          <CartIcon />
          <div
            v-if="cartStore.itemsCount > 0"
            class="text-center absolute text-white w-5 h-5 text-xs p-0 leading-5 rounded-full -end-2 -top-2"
            :style="{ backgroundColor: modeBadgeBg }"
          >
            {{ cartStore.itemsCount }}
          </div>
        </div>

        <button
          v-if="!cartStore.isReturnMode"
          @click="handleClearCart"
          class="ml-auto focus:outline-none transition-colors duration-200 p-1 rounded"
          :style="{ color: 'var(--text-muted)' }"
          :title="__('Clear Cart')"
          :disabled="cartStore.isProcessing"
        >
          <TrashIcon />
        </button>
      </div>

      <!-- Customer Selector (sale + draft) -->
      <CustomerSection
        v-if="!cartStore.isReturnMode"
        @customer-selected="handleCustomerSelected"
      />

      <!-- Customer display (return mode) -->
      <div
        v-if="cartStore.isReturnMode && cartStore.currentCustomer"
        class="px-4 py-2 flex items-center gap-2 text-sm"
        :style="{ borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)' }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span>{{ cartStore.currentCustomer }}</span>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         SCROLLABLE ITEMS AREA (takes remaining height)
    ═══════════════════════════════════════════════════════ -->
    <div class="flex-1 min-h-0 overflow-y-auto">

      <!-- Empty state -->
      <div
        v-if="cartStore.cart.length === 0"
        class="h-full w-full p-4 select-none flex flex-col items-center justify-center"
        :style="{ backgroundColor: 'var(--cart-bg-empty)', color: 'var(--cart-text-empty)' }"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor"
          :style="{ color: 'var(--text-muted)', opacity: 0.4 }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-center text-lg font-medium mt-4">{{ emptyLabel }}</p>
        <p class="text-center text-sm mt-2" :style="{ color: 'var(--text-muted)' }">{{ __(emptyHint) }}</p>
      </div>

      <!-- Items list -->
      <div v-else class="w-full px-4 py-2">
        <transition-group name="cart-item" tag="div">
          <CartItem
            v-for="item in cartStore.cart"
            :key="item.item_code + (item.serial_no || '') + (item.batch_no || '')"
            :item="item"
            :readonly="cartStore.isReadOnly"
            @update-quantity="handleUpdateQuantity"
            @remove-item="handleRemoveItem"
          />
        </transition-group>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         FIXED FOOTER (totals + collapsible sections)
    ═══════════════════════════════════════════════════════ -->
    <div v-if="cartStore.cart.length > 0" class="flex-shrink-0 max-h-[60%] overflow-y-auto">

      <!-- Tax / totals summary -->
      <TaxSummaryStrip
        v-if="cartStore.taxLines.length > 0"
        :tax-lines="cartStore.taxLines"
        :net-total="cartStore.netTotal"
        :tax-amount="cartStore.taxAmount"
        :discount-amount="cartStore.computedDiscountAmount"
        :grand-total="cartStore.totalPrice"
      />

      <!-- Discount (sale + draft) -->
      <DiscountPanel
        v-if="!cartStore.isReturnMode"
        @discount-changed="handleDiscountChanged"
      />

      <!-- Payments list (sale + draft) -->
      <PaymentsList
        v-if="!cartStore.isReturnMode && cartStore.isDraftMode"
        :payments="cartStore.payments"
        :available-modes="availablePaymentModes"
        @update:payments="handlePaymentsUpdate"
      />

      <!-- Payment / Submit Section -->
      <PaymentSection
        v-if="!cartStore.isReturnMode"
        :mode="cartStore.mode"
        :payments="cartStore.payments"
        :selected-invoice="selectedInvoice"
        @submit="handleTransactionData"
        @cash-update="handleCashUpdate"
      />

      <!-- Return Section -->
      <ReturnSection v-else />
    </div>
  </div>
</template>

<script setup>
import CartIcon  from '@/components/icons/CartIcon.svg'
import TrashIcon from '@/components/icons/TrashIcon.svg'
import { ref, computed, nextTick, watch } from 'vue'
import CartItem           from './CartItem.vue'
import PaymentSection     from './PaymentSection.vue'
import ReturnSection      from './ReturnSection.vue'
import CustomerSection    from './CustomerSection.vue'
import ReturnInvoicePanel from './ReturnInvoicePanel.vue'
import DiscountPanel      from './DiscountPanel.vue'
import TaxSummaryStrip    from './TaxSummaryStrip.vue'
import PaymentsList       from './PaymentsList.vue'
import { formatDate }     from '../../utils/formatters'
import { useCartStore }   from '@/stores/cart'
import { useShiftStore }  from '@/stores/shift'
import { useSettingsStore } from '@/stores/settings'
import { useConfirm }     from '@/composables/useConfirm'
import { __ }             from '@/i18n/index'
import { ShoppingCart, FileText, Undo2 } from 'lucide-vue-next'
/* ──────────────────────────────────────────────────────────
   PROPS / EMITS
────────────────────────────────────────────────────────── */
const props = defineProps({
  selectedInvoice: {
    type:    Object,
    default: null,
  },
})
const emit = defineEmits(['submit', 'cart-cleared', 'item-removed', 'clear-invoice'])

/* ──────────────────────────────────────────────────────────
   STORES
────────────────────────────────────────────────────────── */
const cartStore     = useCartStore()
const shiftStore    = useShiftStore()
const settingsStore = useSettingsStore()
const { confirm }   = useConfirm()

const primaryColor = computed(() =>
  settingsStore.settings?.appearance?.primaryColor || '#06b6d4'
)

const availablePaymentModes = computed(() =>
  shiftStore.pos_profile?.payments?.map(p => p.mode_of_payment) || ['Cash']
)

/* ──────────────────────────────────────────────────────────
   MODE-DRIVEN UI HELPERS
────────────────────────────────────────────────────────── */

const MODE_META = {
  sale: {
    badge: __('Sale'),
    icon: ShoppingCart,
    bg: 'var(--success-bg, #d1fae5)',
    color: 'var(--success-text, #065f46)',
  },

  draft: {
    badge: __('Draft Invoice'),
    icon: FileText,
    bg: 'var(--warning-bg, #fef3c7)',
    color: 'var(--warning-text, #92400e)',
  },

  return: {
    badge: __('Return'),
    icon: Undo2,
    bg: 'var(--danger-bg, #fee2e2)',
    color: 'var(--danger-text, #991b1b)',
  },
}

const modeMeta = computed(() =>
  MODE_META[cartStore.mode] || {}
)


const modeBadgeLabel = computed(() => modeMeta.value.badge || cartStore.mode)
const modeBadgeIcon = computed(() => modeMeta.value.icon)
const modeBadgeColor = computed(() => modeMeta.value.color)


const modeBadgeBg = computed(() => primaryColor.value)

const emptyLabel = computed(() => {
  if (cartStore.isReturnMode) return __('NO ITEMS SELECTED')
  if (cartStore.isDraftMode)  return __('DRAFT EMPTY')
  return __('CART EMPTY')
})

const emptyHint = computed(() => {
  if (cartStore.isReturnMode) return 'Select an invoice to load return items'
  if (cartStore.isDraftMode)  return 'Add products to this draft invoice'
  return 'Add some products'
})

/* ──────────────────────────────────────────────────────────
   CUSTOMER
────────────────────────────────────────────────────────── */
const handleCustomerSelected = (customerName) => {
  cartStore.currentCustomer = customerName
  shiftStore.setCustomer?.(customerName)
}

/* ──────────────────────────────────────────────────────────
   RETURN INVOICE PANEL
────────────────────────────────────────────────────────── */
const handleClearReturnInvoice = () => {
  cartStore.clearCart()
  emit('clear-invoice')
}

/* ──────────────────────────────────────────────────────────
   QUANTITY / ITEM HANDLERS
────────────────────────────────────────────────────────── */
const handleUpdateQuantity = (item_code, newQuantity) => {
  if (cartStore.isReadOnly) return
  cartStore.updateQuantity(item_code, newQuantity)
}

const handleRemoveItem = (item_code) => {
  if (cartStore.isReadOnly) return
  cartStore.removeFromCart(item_code)
  emit('item-removed', item_code)
}

/* ──────────────────────────────────────────────────────────
   CLEAR CART
────────────────────────────────────────────────────────── */
const handleClearCart = async () => {
  if (cartStore.isProcessing) return

  const message = cartStore.isDraftMode
    ? __('Are you sure you want to discard this draft?')
    : __('Are you sure you want to clear the cart?')

  const confirmed = await confirm({
    title:        __('Clear Cart'),
    message,
    confirmLabel: __('Clear'),
  })
  if (!confirmed) return

  cartStore.clearCart()
  emit('cart-cleared')
}

/* ──────────────────────────────────────────────────────────
   DISCOUNT
────────────────────────────────────────────────────────── */
const handleDiscountChanged = ({ type, value, applyOn }) => {
  if (applyOn) cartStore.setApplyDiscountOn(applyOn)
  if (type === 'percentage') {
    cartStore.setDiscountPercentage(value)
  } else {
    cartStore.setDiscountAmount(value)
  }
}

/* ──────────────────────────────────────────────────────────
   PAYMENTS
────────────────────────────────────────────────────────── */
const handlePaymentsUpdate = (newPayments) => {
  cartStore.setPayments(newPayments)
}

const handleCashUpdate = (amount) => cartStore.setCash(amount)

/* ──────────────────────────────────────────────────────────
   SUBMIT
────────────────────────────────────────────────────────── */
const handleTransactionData = async (paymentData) => {
  if (cartStore.isReturnMode) return

  if (!cartStore.currentCustomer && !shiftStore.$state.currentCustomer) {
    window.$toast?.warning(__('Please select a customer'))
    return
  }

  const fullData = {
    ...paymentData,
    mode:            cartStore.mode,
    transactionType: cartStore.isDraftMode ? 'draft' : 'sale',
    draftName:       cartStore.isDraftMode ? cartStore.currentDraftName : undefined,
    customer:        cartStore.currentCustomer || shiftStore.$state.currentCustomer,
    payments:        cartStore.payments,
    taxesAndCharges:              cartStore.taxesAndCharges,
    taxCategory:                  cartStore.taxCategory,
    taxLines:                     cartStore.taxLines,
    applyDiscountOn:              cartStore.applyDiscountOn,
    additionalDiscountPercentage: cartStore.additionalDiscountPercentage,
    discountAmount:               cartStore.computedDiscountAmount,
    netTotal:                     cartStore.netTotal,
    taxAmount:                    cartStore.taxAmount,
    grandTotal:                   cartStore.totalPrice,
  }

  emit('submit', fullData)
}

/* ──────────────────────────────────────────────────────────
   WATCHERS
────────────────────────────────────────────────────────── */
const scrollToBottom = () => {
  nextTick(() => {
    const el = document.querySelector('.overflow-y-auto')
    if (el) el.scrollTop = el.scrollHeight
  })
}

watch(
  () => cartStore.cart,
  () => {
    cartStore.recalcTaxLines()
    nextTick(scrollToBottom)
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.cart-item-enter-active,
.cart-item-leave-active { transition: all 0.3s ease; }
.cart-item-enter-from   { opacity: 0; transform: translateY(-10px); }
.cart-item-leave-to     { opacity: 0; transform: translateY(10px);  }
</style>
