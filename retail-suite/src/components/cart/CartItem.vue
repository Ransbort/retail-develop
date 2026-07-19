<template>
  <div
    class="relative select-none mb-3 rounded-xl w-full p-3 transition-all duration-300"
    :style="{
      background: 'var(--item-bg)',
      color: 'var(--text-main)',
      border: '1px solid var(--item-border)'
    }"
    :class="{ 'animate-pulse': isUpdating }"
  >
    <!-- Remove (×) -->
    <button
      @click="handleRemove"
      class="absolute top-2 right-2 w-5 h-5 flex items-center justify-center rounded-full text-sm leading-none transition-colors duration-200 focus:outline-none"
      :style="{ color: 'var(--text-muted)' }"
      @mouseover="$event.currentTarget.style.background = 'var(--warning-bg)'"
      @mouseleave="$event.currentTarget.style.background = 'transparent'"
      :disabled="isUpdating"
      :title="__('Remove this {0} from cart?', { 0: props.item.item_name })"
    >
      ×
    </button>

    <div class="flex gap-3 pr-5">
      <!-- Icon -->
      <div class="flex-shrink-0">
        <div
          class="h-11 w-11 rounded-xl flex items-center justify-center overflow-hidden shadow"
          :style="{ background: primaryColor }"
        >
          <img
            v-if="item.image"
            :src="item.image"
            :alt="item.item_name"
            class="h-6 w-6 object-cover"
          />
          <span v-else class="text-xl">💊</span>
        </div>
      </div>

      <!-- Info -->
      <div class="flex-grow min-w-0">
        <!-- Product Name -->
        <h5
          class="text-sm font-bold leading-snug"
          :title="displayName"
          :style="{ color: 'var(--text-main)' }"
        >
          {{ displayName }}
        </h5>

        <!-- Prescription badges (dosage form / dosage+period) - only
             present on items added via "Load Prescriptions" -->
        <div
          v-if="item.dosage_form || item.dosage || item.period"
          class="flex items-center gap-1 mt-1 flex-wrap"
        >
          <span
            v-if="item.dosage_form"
            class="text-xs px-1.5 py-0.5 rounded flex items-center gap-1 w-fit"
            :style="{ background: 'rgba(16,185,129,0.12)', color: '#0F6E56' }"
          >
            💊 {{ item.dosage_form }}
          </span>
          <span
            v-if="item.dosage || item.period"
            class="text-xs px-1.5 py-0.5 rounded flex items-center gap-1 w-fit"
            :style="{ background: 'rgba(148,163,184,0.18)', color: 'var(--text-muted)' }"
          >
            📅 {{ [item.dosage, item.period].filter(Boolean).join(' • ') }}
          </span>
        </div>

        <!-- Serial No -->
        <span
          v-if="item.serial_no"
          class="text-xs px-1.5 py-0.5 rounded mt-1 w-fit inline-block"
          :style="{ background: 'rgba(16,185,129,0.1)', color: '#0F6E56' }"
        >
          # {{ item.serial_no }}
        </span>

        <!-- Batch No -->
        <span
          v-if="item.batch_no"
          class="text-xs px-1.5 py-0.5 rounded mt-1 w-fit inline-block"
          :style="{ background: 'rgba(99,102,241,0.1)', color: '#4338ca' }"
        >
          Batch: {{ item.batch_no }}
        </span>

        <!-- UOM -->
        <span
          v-if="item.uom && item.uom !== item.stock_uom"
          class="text-xs px-1.5 py-0.5 rounded mt-1 w-fit inline-block"
          :style="{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }"
        >
          {{ item.uom }}
        </span>

        <!-- Category -->
        <span
          v-if="item.category"
          class="text-xs mt-1 block"
          :style="{ color: 'var(--text-muted)' }"
        >
          {{ item.category }}
        </span>

        <!-- Comment (e.g. dosing instructions from the prescription) -->
        <div
          v-if="item.comment"
          class="text-xs mt-2 px-2 py-1.5 rounded-lg truncate"
          :title="item.comment"
          :style="{ background: 'rgba(245,158,11,0.1)', color: '#b45309' }"
        >
          💬 {{ truncatedComment }}
        </div>
      </div>
    </div>

    <!-- Bottom row: quantity controls + price -->
    <div class="flex items-center justify-between mt-3">
      <div class="flex items-center gap-2">
        <!-- Decrease Button -->
        <button
          @click="decreaseQuantity"
          class="w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :style="{ background: primaryColor, color: '#fff' }"
          :disabled="isUpdating || isSerialItem"
          :title="__('Decrease  Quantity')"
        >
          <MinusIcon class="w-3 h-3" />
        </button>

        <!-- Quantity Input -->
        <div class="relative">
          <input
            :value="displayQuantity"
            @input="handleQuantityInput"
            @blur="handleQuantityBlur"
            @keyup.enter="handleQuantityEnter"
            @keyup.escape="resetQuantity"
            type="number"
            min="1"
            max="999"
            class="rounded-lg text-center text-sm w-10 py-1 focus:outline-none transition-all duration-200"
            :style="{
              background: 'var(--input-bg)',
              color: 'var(--text-main)',
              border: hasError ? '1px solid var(--warning-border)' : '1px solid var(--input-border)'
            }"
            :disabled="isUpdating || isSerialItem"
          >
          <!-- Error indicator -->
          <div
            v-if="hasError"
            class="absolute -bottom-1 -right-1 w-2 h-2 rounded-full"
            :style="{ background: 'var(--warning-border)' }"
          />
        </div>

        <!-- Increase Button -->
        <button
          @click="increaseQuantity"
          class="w-7 h-7 rounded-lg flex items-center justify-center focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          :style="{ background: primaryColor, color: '#fff' }"
          :disabled="isUpdating || item.qty >= 999 || isSerialItem"
          :title="__('Increase  Quantity')"
        >
          <PlusIcon class="w-3 h-3" />
        </button>
      </div>

      <!-- Price -->
      <p class="text-xs font-bold" :style="{ color: '#16a34a' }" dir="ltr">
        {{ formatPrice(itemTotal) }}
      </p>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="isUpdating"
      class="absolute inset-0 rounded-xl flex items-center justify-center"
      :style="{ background: 'var(--card-bg)', opacity: 0.75 }"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PlusIcon from '@/components/icons/PlusIcon.svg'
import MinusIcon from '@/components/icons/MinusIcon.svg'
import TrashIcon from '@/components/icons/TrashIcon.svg'
import ImageIcon from '@/components/icons/ImageIcon.svg'
import {formatPrice} from '@/utils/formatters'
import { useSettingsStore } from '@/stores/settings'
import { useConfirm } from '@/composables/useConfirm'

const props = defineProps({
  mode: {
    type: String,
    default: 'sale', // 'sale' or 'return'
    validator: (value) => ['sale', 'return'].includes(value)
  },
  item: {
    type: Object,
    required: true,
    validator: (item) => {
      return item.item_code && item.item_name && item.rate && item.qty
    }
  }
})

const emit = defineEmits(['update-quantity', 'remove-item', 'quantity-error'])

const { confirm } = useConfirm()
const settingsStore = useSettingsStore()


const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})
const isUpdating = ref(false)
const hasError = ref(false)
const displayQuantity = ref(props.item.qty)
const pendingQuantity = ref(props.item.qty)

const isSerialItem = computed(() => !!props.item.serial_no)

// req.medication (the Medication Request's full clinical/brand name, e.g.
// "FUROSIMIDE 20MG INJ (LASIX)") is more meaningful for a dispensed drug
// than the Item master's often-abbreviated item_name (e.g. "FU20 INJ").
// Falls back to item_name for regular (non-prescription) retail items.
const displayName = computed(() => props.item.medication_name || props.item.item_name)

const COMMENT_MAX_LENGTH = 60
const truncatedComment = computed(() => {
  const comment = props.item.comment || ''
  return comment.length > COMMENT_MAX_LENGTH
    ? comment.slice(0, COMMENT_MAX_LENGTH).trimEnd() + '…'
    : comment
})

// Computed properties
const itemTotal = computed(() => {
  return props.item.rate * props.item.qty
})

watch(
  () => props.item.qty,
  (newQty) => {
    displayQuantity.value = newQty
    pendingQuantity.value = newQty
  }
)

const increaseQuantity = () => {

  if (isSerialItem.value) {
    window.$toast?.warning(__('Serial items cannot have quantity more than 1'))
    return
  }

  let newQty = props.item.qty

  if (props.mode === 'return') {
    if (newQty < props.item.originalQuantity) {
      newQty -= 1
    } else {
      window.$toast?.warning(__('You cannot return more than original quantity'))
    }
  } else {
    const cf = props.item.conversion_factor || 1
    const availableQty = Math.floor((props.item.actual_qty || 0) / cf)

    if (newQty >= availableQty) {
      window.$toast?.warning(__('Quantity exceeds available stock'))
      return
    }
    newQty += 1
  }

  emit('update-quantity', props.item.item_code, newQty, props.mode)
}

const decreaseQuantity = () => {

  if (isSerialItem.value) {
    emit('remove-item', props.item.item_code)
    return
  }

  let newQty = props.item.qty
  if (props.mode === 'return') {

    if (newQty < -1) {
      newQty += 1
    } else {
      if (window.$toast) window.$toast.info(__('Can not reduce Quantity below 1 Quantity'))
    }
  } else {
    if (newQty > 1) {
      newQty -= 1
    } else {
      emit('remove-item', props.item.item_code)
      return
    }
  }

  emit('update-quantity', props.item.item_code, newQty)
}

const handleQuantityInput = (event) => {
  const value = parseInt(event.target.value) || 0
  displayQuantity.value = value

  // Validate
  hasError.value = value < 1 || value > 999

  if (!hasError.value) {
    pendingQuantity.value = value
  }
}

const handleQuantityBlur = async () => {
  if (hasError.value) {
    resetQuantity()
    return
  }

  if (pendingQuantity.value !== props.item.qty) {
    // ← تحقق من الـ stock
    const cf = props.item.conversion_factor || 1
    const availableQty = Math.floor((props.item.actual_qty || 0) / cf)

    if (pendingQuantity.value > availableQty) {
      window.$toast?.warning(__('Quantity exceeds available stock'))
      resetQuantity()
      return
    }

    await updateQuantity(pendingQuantity.value)
  }
}
  // Handle enter key on quantity input
  const handleQuantityEnter = async (event) => {
    event.target.blur() // This will trigger handleQuantityBlur
  }

  // Reset quantity to current value
  const resetQuantity = () => {
    displayQuantity.value = props.item.qty
    pendingQuantity.value = props.item.qty
    hasError.value = false
  }

// Update quantity with validation
const updateQuantity = async (newQuantity) => {
  if (isUpdating.value) return

  const isReturnMode = props.mode === 'return'
  console.log('🟢 updateQuantity fired', props.mode, props.item.item_code, newQuantity)

  //  Validate quantity range
  if (!isReturnMode && (newQuantity < 1 || newQuantity > 999 || isNaN(newQuantity))) {
    emit('quantity-error', 'Quantity must be between 1 and 999')
    resetQuantity()
    return
  }

  //  In return mode, allow negative but still reasonable range
  if (isReturnMode && (newQuantity > -1 || isNaN(newQuantity))) {
    emit('quantity-error', 'Return quantity must be between -1 and -999')
    resetQuantity()
    return
  }


  if (newQuantity === props.item.qty) return // No change needed

  isUpdating.value = true
  hasError.value = false

  try {
    emit('update-quantity', props.item.item_code, newQuantity, props.mode)

    await new Promise(resolve => setTimeout(resolve, 200))
  } catch (error) {
    console.error('Failed to update quantity:', error)
    emit('quantity-error', 'Failed to update quantity')
    resetQuantity()
  } finally {
    isUpdating.value = false
  }
}


  // Handle remove item
  const handleRemove = async () => {
    console.log("! Removed")
    if (isUpdating.value) return

    // Show confirmation for expensive items
    if (itemTotal.value > 50000) {
      const confirmed = await confirm({
        type: 'delete',
        title: 'Remove Item',
        message: __(`Remove this ${0} from cart?`,[props.item.item_name]),
        confirmLabel: 'Remove Item',
      })
      if (!confirmed) return

    }

    isUpdating.value = true

    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 300))

      emit('remove-item', props.item.item_code)
    } catch (error) {
      console.error('Failed to remove item:', error)
    } finally {
      isUpdating.value = false
    }
  }
</script>

<style scoped>
/* Quantity input styling */
input[type="number"] {
  -moz-appearance: textfield;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Focus states */
button:focus {
  outline: none;
}

input:focus {
  outline: none;
}

/* Loading animation */
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

/* Transition effects */
.transition-all {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.transition-colors {
  transition: color 0.2s ease, background-color 0.2s ease;
}

/* Button disabled states */
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:disabled:hover {
  background-color: inherit;
  color: inherit;
}

/* Truncate long text */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.min-w-0 {
  min-width: 0;
}

/* Hover effects for buttons */
button:hover:not(:disabled) {
  transform: translateY(-1px);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

/* Image styling */
img {
  object-fit: cover;
}

/* Responsive adjustments */
@media (max-width: 640px) {
  .text-sm {
    font-size: 0.75rem;
  }

  .text-xs {
    font-size: 0.625rem;
  }
}
</style>
