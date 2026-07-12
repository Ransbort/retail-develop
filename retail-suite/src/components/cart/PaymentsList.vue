<!-- PaymentsList.vue
     Compact payments list. Shows existing payment rows (from a loaded
     draft invoice) and lets the cashier add additional payment lines
     (e.g. extra cash on top of an existing payment).
     Used in sale + draft mode.
-->
<template>
  <div
    class="px-4 py-2 text-sm"
    :style="{ borderTop: '1px solid var(--card-border)' }"
  >
    <!-- Header / toggle -->
    <button
      class="flex items-center gap-2 w-full text-xs font-semibold"
      :style="{ color: 'var(--text-muted)' }"
      @click="expanded = !expanded"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      <span>{{ __('Payments') }}</span>
      <span class="ml-auto font-bold" :style="{ color: 'var(--text-main)' }">
        {{ formatPrice(totalPaid) }}
      </span>
      <svg
        xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform"
        :class="{ 'rotate-180': expanded }"
        fill="none" viewBox="0 0 24 24" stroke="currentColor"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>

    <!-- Expanded: scrollable list + add row -->
    <transition name="slide-down">
      <div v-if="expanded" class="mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1">

        <!-- Existing payment rows -->
        <div
          v-for="(p, idx) in payments"
          :key="idx"
          class="flex items-center gap-2 rounded-lg px-2 py-1.5"
          :style="{ background: 'var(--input-bg, var(--card-bg))', border: '1px solid var(--card-border)' }"
        >
          <select
            class="text-xs rounded px-1.5 py-1 border outline-none flex-shrink-0"
            :style="{ background: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-main)' }"
            :value="p.mode_of_payment"
            @change="updateMode(idx, $event.target.value)"
          >
            <option v-for="m in availableModes" :key="m" :value="m">{{ m }}</option>
          </select>

          <input
            type="number" min="0" step="0.01"
            class="flex-1 text-sm text-end rounded px-2 py-1 border outline-none"
            :style="{ background: 'transparent', borderColor: 'var(--card-border)', color: 'var(--text-main)' }"
            :value="p.amount"
            @input="updateAmount(idx, $event.target.value)"
          />

          <button
            class="flex-shrink-0 p-1"
            :style="{ color: 'var(--danger-text, #b91c1c)' }"
            @click="removePayment(idx)"
            :title="__('Remove')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Add payment button -->
        <button
          class="w-full text-xs font-medium py-1.5 rounded-lg border border-dashed transition-colors"
          :style="{ borderColor: 'var(--card-border)', color: 'var(--text-muted)' }"
          @click="addPayment"
        >
          + {{ __('Add Payment') }}
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatPrice } from '../../utils/formatters'
import { __ } from '@/i18n/index'

const props = defineProps({
  payments: {
    type: Array,
    default: () => [],
  },
  availableModes: {
    type: Array,
    default: () => ['Cash', 'Card', 'Bank Transfer'],
  },
})

const emit = defineEmits(['update:payments'])

const expanded = ref(false)

const totalPaid = computed(() =>
  props.payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
)

const addPayment = () => {
  const used = props.payments.map(p => p.mode_of_payment)
  const nextMode = props.availableModes.find(m => !used.includes(m)) || props.availableModes[0]

  emit('update:payments', [
    ...props.payments,
    { mode_of_payment: nextMode, amount: 0 },
  ])
}

const removePayment = (idx) => {
  const updated = props.payments.filter((_, i) => i !== idx)
  emit('update:payments', updated)
}

const updateAmount = (idx, value) => {
  const updated = props.payments.map((p, i) =>
    i === idx ? { ...p, amount: Number(value) || 0 } : p
  )
  emit('update:payments', updated)
}

const updateMode = (idx, value) => {
  const updated = props.payments.map((p, i) =>
    i === idx ? { ...p, mode_of_payment: value } : p
  )
  emit('update:payments', updated)
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active { transition: all 0.25s ease; }
.slide-down-enter-from,
.slide-down-leave-to     { opacity: 0; transform: translateY(-6px); }
</style>
