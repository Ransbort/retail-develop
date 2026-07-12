<!-- TaxSummaryStrip.vue
     Shows net total / tax lines / discount / grand total above PaymentSection.
-->
<template>
  <div
    class="px-4 py-2 text-xs"
    :style="{
      borderTop:  '1px solid var(--card-border)',
      background: 'var(--cart-bg)',
      color:      'var(--text-muted)',
    }"
  >
    <!-- Net Total -->
    <div class="flex justify-between py-0.5">
      <span>{{ __('Net Total') }}</span>
      <span>{{ formatPrice(netTotal) }}</span>
    </div>

    <!-- Individual tax lines -->
    <div
      v-for="t in taxLines"
      :key="t.account_head"
      class="flex justify-between py-0.5"
    >
      <span>{{ t.description || t.account_head }} ({{ t.rate }}%)</span>
      <span>{{ formatPrice(t.amount) }}</span>
    </div>

    <!-- Discount -->
    <div v-if="discountAmount > 0" class="flex justify-between py-0.5 text-green-600">
      <span>{{ __('Discount') }}</span>
      <span>-{{ formatPrice(discountAmount) }}</span>
    </div>

    <!-- Grand Total -->
    <div
      class="flex justify-between py-1 mt-1 font-bold text-sm"
      :style="{
        borderTop: '1px dashed var(--card-border)',
        color:     'var(--text-main)',
      }"
    >
      <span>{{ __('Grand Total') }}</span>
      <span>{{ formatPrice(grandTotal) }}</span>
    </div>
  </div>
</template>

<script setup>
import { formatPrice } from '../../utils/formatters'
import { __ }          from '@/i18n/index'

defineProps({
  taxLines:       { type: Array,  default: () => [] },
  netTotal:       { type: Number, default: 0 },
  taxAmount:      { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  grandTotal:     { type: Number, default: 0 },
})
</script>
