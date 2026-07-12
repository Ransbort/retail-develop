<!-- DiscountPanel.vue
     Allows the cashier to set a discount (% or flat) and choose
     whether it applies on Net Total or Grand Total.
     Only rendered in sale / draft mode.
-->
<template>
  <div
    v-if="show"
    class="px-4 py-3 text-sm"
    :style="{
      borderTop:   '1px solid var(--card-border)',
      background:  'var(--cart-bg)',
    }"
  >
    <!-- Toggle row -->
    <button
      class="flex items-center gap-2 w-full text-xs font-semibold mb-2"
      :style="{ color: 'var(--text-muted)' }"
      @click="expanded = !expanded"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a2 2 0 012-2z" />
      </svg>
      <span>{{ __('Discount') }}</span>
      <span v-if="cartStore.computedDiscountAmount > 0" class="ml-auto text-green-600">
        -{{ formatPrice(cartStore.computedDiscountAmount) }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-auto transition-transform"
        :class="{ 'rotate-180': expanded }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Expanded controls -->
    <transition name="slide-down">
      <div v-if="expanded" class="space-y-2">

        <!-- Apply discount on -->
        <div class="flex gap-2">
          <button
            v-for="opt in discountOnOptions"
            :key="opt.value"
            class="flex-1 py-1 rounded-lg text-xs font-medium border transition-colors"
            :style="applyDiscountOn === opt.value
              ? { background: primaryColor, color: '#fff', borderColor: primaryColor }
              : { background: 'transparent', color: 'var(--text-muted)', borderColor: 'var(--card-border)' }"
            @click="setDiscountOn(opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>

<!-- Percentage + Flat amount side by side -->
<div class="flex gap-2">
  <div class="flex-1 flex items-center gap-2">
    <label class="text-xs shrink-0" :style="{ color: 'var(--text-muted)' }">
      {{ __('Pct (%)') }}
    </label>
    <input
      type="number" min="0" max="100" step="0.5"
      class="w-full rounded-lg px-3 py-1.5 text-sm border outline-none"
      :style="{
        background:  'var(--input-bg, var(--card-bg))',
        borderColor: 'var(--card-border)',
        color:       'var(--text-main)',
      }"
      :value="cartStore.additionalDiscountPercentage || ''"
      :placeholder="__('0')"
      @input="onPctInput"
    />
  </div>

  <div class="flex-1 flex items-center gap-2">
    <label class="text-xs shrink-0" :style="{ color: 'var(--text-muted)' }">
      {{ __('Amount') }}
    </label>
    <input
      type="number" min="0" step="1"
      class="w-full rounded-lg px-3 py-1.5 text-sm border outline-none"
      :style="{
        background:  'var(--input-bg, var(--card-bg))',
        borderColor: 'var(--card-border)',
        color:       'var(--text-main)',
      }"
      :value="cartStore.discountAmount || ''"
      :placeholder="__('0')"
      @input="onAmountInput"
    />
  </div>
</div>

        <!-- Clear button -->
        <button
          v-if="cartStore.computedDiscountAmount > 0"
          class="text-xs underline"
          :style="{ color: 'var(--danger-text, #b91c1c)' }"
          @click="cartStore.clearDiscount()"
        >
          {{ __('Remove discount') }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCartStore }     from '@/stores/cart'
import { useSettingsStore } from '@/stores/settings'
import { formatPrice }      from '../../utils/formatters'
import { __ }               from '@/i18n/index'

const emit = defineEmits(['discount-changed'])

const cartStore     = useCartStore()
const settingsStore = useSettingsStore()

const show     = computed(() => !cartStore.isReturnMode)
const expanded = ref(false)

const primaryColor = computed(() =>
  settingsStore.settings?.appearance?.primaryColor || '#06b6d4'
)

const discountOnOptions = [
  { value: 'Net Total',   label: __('Net Total')   },
  { value: 'Grand Total', label: __('Grand Total') },
]

const applyDiscountOn = computed(() => cartStore.applyDiscountOn)

const setDiscountOn = (val) => {
  cartStore.setApplyDiscountOn(val)
  emit('discount-changed', {
    type:    cartStore.additionalDiscountPercentage > 0 ? 'percentage' : 'amount',
    value:   cartStore.additionalDiscountPercentage || cartStore.discountAmount,
    applyOn: val,
  })
}

const onPctInput = (e) => {
  const val = parseFloat(e.target.value) || 0
  cartStore.setDiscountPercentage(val)
  emit('discount-changed', { type: 'percentage', value: val, applyOn: cartStore.applyDiscountOn })
}

const onAmountInput = (e) => {
  const val = parseFloat(e.target.value) || 0
  cartStore.setDiscountAmount(val)
  emit('discount-changed', { type: 'amount', value: val, applyOn: cartStore.applyDiscountOn })
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from,
.slide-down-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
