<!-- ReturnInvoicePanel.vue
     Shows original invoice details in return mode (read-only snapshot).
-->
<template>
  <div
    class="px-4 py-3"
    :style="{
      background:   'var(--danger-bg, #fee2e2)',
      borderBottom: '1px solid var(--danger-border, #fca5a5)',
    }"
  >
    <!-- Header row -->
    <div class="flex items-start justify-between gap-2 mb-2">
      <div class="flex items-center gap-2">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
          :style="{ background: 'var(--danger-border, #fca5a5)' }"
        >
          ↩
        </div>
        <div>
          <p class="text-sm font-bold" :style="{ color: 'var(--text-main)' }">
            {{ invoice.name }}
          </p>
          <p class="text-xs" :style="{ color: 'var(--text-muted)' }">
            {{ formatDate(invoice.posting_date) }}
          </p>
        </div>
      </div>

      <button
        @click="emit('clear')"
        class="transition-colors p-1 rounded"
        :style="{ color: 'var(--danger-text, #991b1b)' }"
        :title="__('Clear selection')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <!-- Customer -->
    <div v-if="invoice.customer" class="flex items-center gap-1 text-xs mb-1" :style="{ color: 'var(--text-muted)' }">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
      <span>{{ invoice.customer }}</span>
    </div>

    <!-- Totals grid -->
    <div
      class="grid grid-cols-2 gap-x-4 gap-y-1 mt-2 pt-2 text-xs"
      :style="{ borderTop: '1px dashed var(--danger-border, #fca5a5)' }"
    >
      <span :style="{ color: 'var(--text-muted)' }">{{ __('Net Total') }}</span>
      <span class="text-end font-medium">{{ formatPrice(invoice.net_total) }}</span>

      <template v-if="invoice.total_taxes_and_charges">
        <span :style="{ color: 'var(--text-muted)' }">{{ __('Tax') }}</span>
        <span class="text-end font-medium">{{ formatPrice(invoice.total_taxes_and_charges) }}</span>
      </template>

      <template v-if="invoice.discount_amount">
        <span :style="{ color: 'var(--text-muted)' }">{{ __('Discount') }}</span>
        <span class="text-end font-medium text-green-600">-{{ formatPrice(invoice.discount_amount) }}</span>
      </template>

      <span class="font-bold" :style="{ color: 'var(--text-main)' }">{{ __('Grand Total') }}</span>
      <span class="text-end font-bold" :style="{ color: 'var(--text-main)' }">
        {{ formatPrice(invoice.grand_total) }}
      </span>
    </div>

    <!-- Payments -->
    <div
      v-if="invoice.payments && invoice.payments.length"
      class="mt-2 pt-2"
      :style="{ borderTop: '1px dashed var(--danger-border, #fca5a5)' }"
    >
      <p class="text-xs font-semibold mb-1" :style="{ color: 'var(--text-muted)' }">{{ __('Payments') }}</p>
      <div
        v-for="p in invoice.payments"
        :key="p.mode_of_payment"
        class="flex justify-between text-xs"
        :style="{ color: 'var(--text-muted)' }"
      >
        <span>{{ p.mode_of_payment }}</span>
        <span>{{ formatPrice(p.amount) }}</span>
      </div>
    </div>

    <!-- Remarks -->
    <div
      v-if="invoice.remarks"
      class="mt-2 text-xs italic"
      :style="{ color: 'var(--text-muted)' }"
    >
      {{ invoice.remarks }}
    </div>

    <!-- Read-only badge -->
    <div
      class="mt-2 flex items-center gap-1 text-xs font-semibold"
      :style="{ color: 'var(--danger-text, #991b1b)' }"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      {{ __('Quantities are locked – return only') }}
    </div>
  </div>
</template>

<script setup>
import { formatDate, formatPrice } from '../../utils/formatters'
import { __ } from '@/i18n/index'

defineProps({
  invoice: { type: Object, required: true },
})
const emit = defineEmits(['clear'])
</script>
