<!-- Payment Section -->
<template>
  <div
    class="select-none h-auto w-full text-center pt-3 pb-4 px-4 rounded-lg"
    :style="{
      backgroundColor: 'var(--card-bg)',
      borderTop: '1px solid var(--card-border)',
      color: 'var(--text-main)'
    }"
  >
    <!-- Order Summary -->
    <div class="mb-4">

      <!-- Subtotal -->
      <div
        v-if="showDetailedSummary"
        class="flex justify-between mb-2 text-sm w-full"
        :style="{ color: 'var(--text-sub)' }"
      >
		<div>{{ __('Subtotal') }}</div>
        <div>{{ formatPrice(cartStore.subtotal) }}</div>
      </div>

      <hr v-if="cartStore.taxAmount > 0 || cartStore.taxRate > 0" class="my-2">
      <!-- Tax -->
      <div
        v-if="cartStore.taxAmount > 0 || cartStore.taxRate > 0"
        class="flex justify-between mb-2 text-sm"
        :style="{ color: 'var(--text-sub)' }"
      >
        <div>{{ formatPrice(cartStore.taxAmount > 0 ? cartStore.taxAmount : 0) }}</div>
        <div>{{ __('Tax') }} ({{ cartStore.taxRate }}%)</div>
      </div>

      <!-- Discount -->
      <hr v-if="cartStore.discountAmount > 0" class="my-2">
      <div
        v-if="cartStore.discountAmount > 0 || cartStore.discountRate > 0"
        class="flex justify-between mb-2 text-sm"
        :style="{ color: 'var(--icon-color-green)' }"
      >
        <div>{{ formatPrice(cartStore.discountAmount > 0 ? cartStore.discountAmount : 0) }}</div>
        <div>{{ __('Discount') }} ({{ cartStore.discountRate }}%)</div>
      </div>

      <!-- Total -->
      <div
        class="flex justify-between mb-3 text-sm font-semibold pt-2"
        :style="{
          color: 'var(--text-main)',
          borderTop: '1px solid var(--card-border)'
        }"
      >
        <div>{{ __('Total') }}</div>
		<div>{{ formatPrice(cartStore.totalPrice) }}</div>
      </div>
    </div>

    <!-- Cash Payment Section -->
    <div
      v-if="props.mode === 'sale'"
      class="mb-3 px-3 pt-2 pb-3 rounded-lg"
      :style="{
        backgroundColor: 'var(--item-bg)',
        border: '1px solid var(--item-border)'
      }"
    >
      <!-- Cash Input -->
      <div class="flex items-center justify-between text-lg font-semibold mb-3">

        <!-- Label -->
        <div class="text-start" :style="{ color: 'var(--text-main)' }">
          {{ selectedPaymentMethod }}
        </div>

        <!-- Input Group -->
        <div class="flex items-center gap-2">

          <!-- Currency -->
          <span class="text-sm text-end whitespace-nowrap"
                :style="{ color: 'var(--text-sub)' }">
            {{ currency }}
          </span>

          <!-- Input -->
          <input
            ref="cashInput"
            :value="formatCashInput(cashAmount)"
            @input="handleCashInput"
            @focus="handleCashFocus"
            @blur="handleCashBlur"
            @keyup.enter="handleQuickSubmit"
            @keyup.escape="resetCash"
            type="text"
            inputmode="numeric"
            class="w-32 text-end rounded-lg px-3 transition-all duration-200 tabular-nums"
            :style="{
              backgroundColor: 'var(--input-bg)',
              color: 'var(--text-main)',
              border: hasPaymentError
                ? '1px solid var(--warning-border)'
                : isExactAmount
                ? '1px solid var(--icon-color-green)'
                : '1px solid var(--input-border)'
            }"
            placeholder="0"
            :disabled="cartStore.isProcessing"
          >
        </div>
      </div>

      <!-- Payment Error -->
      <div
        v-if="hasPaymentError"
        class="text-sm mb-2 text-left"
        :style="{ color: 'var(--warning-border)' }"
      >
        {{ paymentErrorMessage }}
      </div>

      <!-- Divider -->
      <hr :style="{ borderColor: 'var(--card-border)' }" class="my-2">

      <!-- Quick Cash Buttons
      <div class="grid grid-cols-3 gap-2 mt-2">
        <button
          v-for="money in quickCashAmounts"
          :key="money"
          @click="addCashAmount(money)"
          class="rounded-lg shadow hover:shadow-lg focus:outline-none text-sm px-2 py-1 transition-all duration-200 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          :style="{
            background: 'var(--card-bg)',
            color: 'var(--text-main)',
            border: '1px solid var(--card-border)'
          }"
          :disabled="cartStore.isProcessing"
          :title="`Add ${formatPrice(money)}`"
        >
          +{{ formatShortPrice(money) }}
        </button>
      </div> -->

      <!-- Quick Actions -->
      <div class="grid grid-cols-2 gap-2 mt-2">
        <!-- Exact Button -->
        <button
          @click="setExactAmount"
          class="rounded-lg shadow focus:outline-none px-2 py-1 text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :style="{
            background: 'var(--info-bg)',
            color: 'var(--focus-ring)',
            border: '1px solid var(--info-border)'
          }"
          :disabled="cartStore.isProcessing"
        >
          <ExactIcon class="w-3 h-3 inline mr-1" />
          {{ __('Exact') }}
        </button>
        <!-- Clear Button -->
        <button
          @click="clearCash"
          class="rounded-lg shadow focus:outline-none px-2 py-1 text-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :style="{
            background: 'var(--item-bg)',
            color: 'var(--text-muted)',
            border: '1px solid var(--item-border)'
          }"
          :disabled="cartStore.isProcessing"
        >
          <ClearIcon class="w-3 h-3 inline mr-1" />
          {{ __('Clear') }}
        </button>
      </div>
    </div>

    <!-- Change Display -->
    <div class="mb-3">

      <!-- Positive Change -->
      <div
        v-if="changeAmount > 0"
        class="flex text-lg font-semibold rounded-lg py-2 px-3"
        :style="{
          backgroundColor: 'var(--info-bg)',
          color: 'var(--focus-ring)',
          border: '1px solid var(--info-border)'
        }"
      >
        <div class="flex items-center" :style="{ color: 'var(--focus-ring)' }">
          <ChangeIcon class="w-5 h-5 mr-2" />
          CHANGE
        </div>
        <div class="text-right flex-grow">
          {{ formatPrice(changeAmount) }}
        </div>
      </div>

      <!-- Negative Change (Insufficient) -->
      <div
        v-else-if="changeAmount < 0"
        class="flex text-lg font-semibold rounded-lg py-2 px-3"
        :style="{
          backgroundColor: 'var(--warning-bg)',
          color: 'var(--warning-border)',
          border: '1px solid var(--warning-border)'
        }"
      >
        <div v-if="!showPartialOption" class="flex items-center justify-between w-full">
          <div
            role="button"
            tabindex="0"
            @click="showPartialOption = true"
            @keydown.enter="showPartialOption = true"
            @keydown.space.prevent="showPartialOption = true"
            class="flex items-center cursor-pointer select-none hover:opacity-90 active:scale-95 transition-transform duration-150"
            :style="{ color: 'var(--warning-border)' }"
            aria-label="Show partial option"
          >
            <WarningIcon class="w-5 h-5 mr-2" />
            {{ __('Insufficient') }}
          </div>
            <div>
              {{ formatPrice(insufficientAmount) }}
              {{ __('Needed') }}
            </div>

        </div>

        <div v-else class="flex items-center justify-between w-full">
          <div class="flex items-center gap-2 flex-1">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"
              :style="{ color: 'var(--warning-border)' }"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span class="text-sm font-semibold" :style="{ color: 'var(--warning-border)' }">
              {{ __('Partial Payment') }}
            </span>
          </div>

          <div class="flex gap-1">
            <!-- Confirm -->
            <button
              class="p-1.5 text-white rounded-lg transition-all duration-200"
              :style="{ background: 'var(--icon-color-green)' }"
              @click="enablePartialPayment(true)"
              :title= "__('Confirm partial payment')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </button>

            <!-- Cancel -->
            <button
              class="p-1.5 text-white rounded-lg transition-all duration-200"
              :style="{ background: 'var(--text-muted)' }"
              @click="enablePartialPayment(false)"
              :title="__('Cancel')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Exact Amount -->
      <div
        v-else-if="changeAmount === 0 && paidAmount > 0"
        class="flex justify-center text-lg font-semibold rounded-lg py-2 px-3"
        :style="{
          background: 'var(--info-bg)',
          color: 'var(--focus-ring)',
          border: '1px solid var(--info-border)'
        }"
      >
        <ThumbsUpIcon class="w-6 h-6 inline-block mr-2" />
        {{ __('Exact Amount') }}
      </div>
    </div>

    <!-- Payment Method Selection -->
    <div v-if="showPaymentMethods && props.mode !== 'draft'" class="mb-3">
      <div
        class="text-sm mb-2"
        :style="{ color: 'var(--text-muted)' }"
      >
        {{ __('Payment Method') }}
      </div>
      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="method in paymentMethods"
          :key="method"
          @click="selectPaymentMethod(method.name)"
          class="px-3 py-2 text-xs rounded-lg transition-all duration-200"
          :style="selectedPaymentMethod === method.name
            ? { background: primaryColor, color: '#fff', border: '1px solid transparent' }
            : { background: 'var(--card-bg)', color: 'var(--text-main)', border: '1px solid var(--card-border)' }
          "
          :disabled="cartStore.isProcessing"
        >
          <component :is="method.icon" class="w-4 h-4 inline mr-1" />
          {{ method.name }}
        </button>
      </div>
    </div>

    <!-- Submit Button -->
    <button data-submit-cart
      :style="{ background: primaryColor }"
      class="text-white rounded-2xl text-lg w-full py-3 focus:outline-none transition-all duration-200 transform disabled:transform-none relative overflow-hidden"
      :class="submitButtonClass"
      :disabled="!canSubmit"
      @click="handleSubmit"
    >
      <div class="relative z-10 flex items-center justify-center">
        <component :is="submitButtonIcon" class="w-6 h-6 mr-2" />
        {{ submitButtonText }}
      </div>

      <!-- Loading Animation -->
      <div
        v-if="cartStore.isProcessing"
        class="absolute inset-0 flex items-center justify-center"
        :style="{ background: primaryColor }"
      >
        <LoadingSpinner class="w-6 h-6" />
      </div>

      <!-- Success Animation -->
      <div
        v-if="showSuccessAnimation"
        class="absolute inset-0 flex items-center justify-center animate-pulse"
        :style="{ background: 'var(--icon-color-green)' }"
      >
      </div>
    </button>

    <!-- Additional Info -->
    <div class="mt-2 text-xs" :style="{ color: 'var(--text-muted)' }">
      <div v-if="cartStore.itemsCount > 0">
        {{ cartStore.itemsCount }} {{ cartStore.itemsCount === 1 ? __('item in cart') : __('items in cart') }}
      </div>
      <div v-if="lastTransactionId" class="mt-1">
        {{ __('Last transaction: {0}', [lastTransactionId]) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useShiftStore } from '@/stores/shift'
import { formatPrice } from '../../utils/formatters'
import ExactIcon from '@/components/icons/ExactIcon.svg'
import ClearIcon from '@/components/icons/ClearIcon.svg'
import ChangeIcon from '@/components/icons/ChangeIcon.svg'
import WarningIcon from '@/components/icons/WarningIcon.svg'
import ThumbsUpIcon from '@/components/icons/ThumbsUpIcon.svg'
import CheckIcon from '@/components/icons/CheckIcon.svg'
import LockIcon from '@/components/icons/LockIcon.svg'
import LoadingSpinner from '@/components/icons/LoadingSpinner.vue'
import CashIcon from '@/components/icons/CashIcon.svg'
import CardIcon from '@/components/icons/CardIcon.svg'
import PhoneIcon from '@/components/icons/PhoneIcon.svg'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  mode: {
    type: String,
    default: 'sale', // 'sale' or 'return'
    validator: (value) => ['sale', 'return', 'draft'].includes(value)
  },
  selectedInvoice: {
    type: Object,
    default: null
  },
  showDetailedSummary: {
    type: Boolean,
    default: true
  },
  showPaymentMethods: {
    type: Boolean,
    default: true
  },
  autoFocusCash: {
    type: Boolean,
    default: true
  },
  payments: {
    type: Array,
    default: () => []
  }
  })
const emit = defineEmits(['submit', 'cash-update', 'payment-error', 'payment-success'])

const totalPaid = computed(() =>
  props.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
)
console.log("totalPaid",totalPaid.value)

watch(totalPaid, (val) => {
  console.log("totalPaid changed",val)
})

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})

const cartStore = useCartStore()
const cashInput = ref(null)
const cashAmount = ref(0)
const hasPaymentError = ref(false)
const paymentErrorMessage = ref('')
const showSuccessAnimation = ref(false)

const lastTransactionId = ref('')
const isFocused = ref(false)
const shiftStore = useShiftStore()
// Quick cash amounts
const quickCashAmounts = computed(() => cartStore.moneys || [2000, 5000, 10000, 20000, 50000, 100000])
// Initialize currency from store or default
const showPartialOption = ref(false)
const allowPartialPayment = ref(false)

const enablePartialPayment = (val) => {
    allowPartialPayment.value = val
    console.log('💳 Partial payment enabled',allowPartialPayment.value)

    if (allowPartialPayment.value) {
      window.$toast.info('Partial payment activated ✔')
    }else{
      showPartialOption.value = false
      window.$toast.warning('Partial payment stopped ✔')
    }
}

const currency = computed(() => shiftStore.pos_profile.currency || 'SAR')
const paymentMethods = computed(() => {

  return (shiftStore.payment_methods || []).map(pm => {
    return {
      id: pm.row_id,
      name: pm.mode_of_payment,
      icon: mapIcon(pm.mode_of_payment),
      default:pm.default
    }
  })
})
const selectedPaymentMethod = ref(
  paymentMethods.value.find(pm => pm.default)?.name || null
)

function mapIcon(name) {
  switch(name.toLowerCase()) {
    case 'cash': return 'CashIcon'
    case 'credit card': return 'CardIcon'
    case 'digital': return 'PhoneIcon'
    default: return 'CashIcon'
  }
}

const paidAmount = computed(() => {
  return props.mode === 'draft' ? totalPaid.value : cashAmount.value
})

const changeAmount = computed(() => {
  return paidAmount.value - cartStore.totalPrice
})

const isExactAmount = computed(() => {
  return changeAmount.value === 0 && paidAmount.value > 0
})

const insufficientAmount = computed(() => {
  if (props.mode === 'return') return 0
  return Math.max(cartStore.totalPrice - paidAmount.value, 0)
})

const canSubmit = computed(() => {

  if (cartStore.isProcessing || hasPaymentError.value) {
    return false
  }

  const hasItems = cartStore.cart.length > 0

  const checkPayment = (paid) => {
    const hasEnough = paid >= cartStore.totalPrice

    const partialAllowed =
      allowPartialPayment.value &&
      paid < cartStore.totalPrice

    return hasEnough || partialAllowed
  }

  switch (props.mode) {

      case 'sale':
        return (
          hasItems &&
          checkPayment(cashAmount.value)
        )


      case 'draft':
        return (
          hasItems &&
          checkPayment(totalPaid.value)
        )


      case 'return':
        return (
          !!returnInvoice.value &&
          returnItems.value.length > 0
        )


      default:
        return false
  }

})

const submitButtonClass = computed(() => {
  if (cartStore.isProcessing) {
    return 'bg-cyan-400 cursor-wait'
  } else if (canSubmit.value) {
    return 'bg-cyan-500 hover:bg-cyan-600 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
  } else {
    return 'bg-gray-200 cursor-not-allowed'
  }
})

const submitButtonText = computed(() =>{
    if (props.mode === 'draft') {
      if (cartStore.isProcessing) {
        return __('PROCESSING')
      } else if(totalPaid.value < cartStore.totalPrice){
          return __('NEED {0} MORE', [formatPrice(cartStore.totalPrice - totalPaid.value)])
      } else {
        return __('Submit Invoice')
      }
    }
    else if (props.mode === 'return') {
      return __('Create Return')
    }
    else if (props.mode === 'sale') {
      if (cartStore.isProcessing) {
        return __('PROCESSING')
      } else if (cartStore.cart.length === 0) {
        return __('ADD ITEMS TO CART')
      } else if (cashAmount.value < cartStore.totalPrice) {
        return __('NEED {0} MORE', [formatPrice(cartStore.totalPrice - cashAmount.value)])
      } else {
        return __('COMPLETE SALE')
      }
    }
  })

const submitButtonIcon = computed(() => {
  if (cartStore.isProcessing) {
    return 'LoadingSpinner'
  } else if (canSubmit.value) {
    return 'CheckIcon'
  } else {
    return 'LockIcon'
  }
})

// Watch cash amount changes
watch(cashAmount, (newAmount) => {
  cartStore.setPayments([
    { mode_of_payment: selectedPaymentMethod.value || 'Cash', amount: newAmount }
  ])
  emit('cash-update', newAmount)

  if (hasPaymentError.value && newAmount >= cartStore.totalPrice) {
    clearPaymentError()
  }
})
const formatShortPrice = (price) => {
  if (price >= 1000000) {
    return `${price / 1000000}M`
  } else if (price >= 1000) {
    return `${price / 1000}K`
  }
  return price.toString()
}

const formatCashInput = (amount) => {
  if (isFocused.value) {
    return amount.toString()
  }
  return new Intl.NumberFormat('en-SA').format(amount || 0)
}

// Handle cash input
const handleCashInput = (event) => {
  const value = event.target.value.replace(/[^\d]/g, '')
  const numericValue = parseInt(value) || 0

  // Validate maximum amount (prevent overflow)
  if (numericValue > 99999999) {
    setPaymentError('Amount too large')
    return
  }

  cashAmount.value = numericValue
  clearPaymentError()
}

// Handle cash input focus
const handleCashFocus = () => {
  isFocused.value = true
}

// Handle cash input blur
const handleCashBlur = () => {
  isFocused.value = false
}

// Add cash amount
const addCashAmount = (amount) => {
  const newAmount = cashAmount.value + amount
  if (newAmount > 99999999) {
    setPaymentError('Amount too large')
    return
  }
  cashAmount.value = newAmount
}

// Set exact amount
const setExactAmount = () => {
  cashAmount.value = cartStore.totalPrice
  clearPaymentError()
}

// Clear cash
const clearCash = () => {
  cashAmount.value = 0
  clearPaymentError()
}

// Reset cash to previous valid value
const resetCash = () => {
  cashAmount.value = cartStore.cash || 0
  clearPaymentError()
}

// Set payment error
const setPaymentError = (message) => {
  hasPaymentError.value = true
  paymentErrorMessage.value = message
  emit('payment-error', message)
}

// Clear payment error
const clearPaymentError = () => {
  hasPaymentError.value = false
  paymentErrorMessage.value = ''
}

const selectPaymentMethod = (methodName) => {
  if (selectedPaymentMethod.value === methodName) return
  selectedPaymentMethod.value = methodName

  if (props.mode === 'sale') {
    cartStore.setPayments([
      { mode_of_payment: methodName, amount: cashAmount.value }
    ])
  }
}

// Handle quick submit (Enter key)
const handleQuickSubmit = () => {
  if (canSubmit.value) {
    handleSubmit()
  }
}

// Handle submit
const handleSubmit = async () => {

  console.log("1️⃣ PaymentSection: handleSubmit started")
  if (!canSubmit.value) return

  try {
    // Show success animation briefly
    showSuccessAnimation.value = true
    console.log("2️⃣ PaymentSection: About to process transaction")
    console.log("   Mode prop:", props.mode)

    const transactionData = await cartStore.processTransaction(props.mode)
    console.log("3️⃣ PaymentSection: Got transactionData!")
    console.log("   Data:", transactionData)

    const fullData = {
        ...transactionData,
        cashAmount: cashAmount.value,
        change: changeAmount.value,
        paymentMethod: selectedPaymentMethod.value
      }
    // Emit success
    console.log("4️⃣ PaymentSection: Full data prepared")
    console.log("   Full data:", fullData)

    // ✅ أطلع emit
    console.log("5️⃣ PaymentSection: Emitting 'submit'...")
    emit('submit', fullData)

    console.log("6️⃣ PaymentSection: Emit done!")

    // Reset form
    setTimeout(() => {
      resetPaymentForm()
    }, 1000)

  } catch (error) {
      console.error('❌ PaymentSection Error:', error)
      setPaymentError('Payment processing failed. Please try again.')
  } finally {
    showSuccessAnimation.value = false
  }
}

const resetPaymentForm = () => {
  cashAmount.value = 0
  clearPaymentError()
  selectedPaymentMethod.value = paymentMethods.value.find(pm => pm.default)?.name || null
}

watch(changeAmount, (val) => {
  if (val >= 0) {
    showPartialOption.value = false
  }
})

// Focus cash input
const focusCashInput = () => {
  nextTick(() => {
    if (cashInput.value) {
      cashInput.value.focus()
      cashInput.value.select()
    }
  })
}

// Initialize
if (props.autoFocusCash) {
  nextTick(() => {
    focusCashInput()
  })
}

</script>
