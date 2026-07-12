<template>
  <div
    v-if="cartStore.isReturn"
    class="select-none h-auto w-full text-center pt-3 pb-4 px-4"
    :style="{
      borderTop: '1px solid var(--card-border)',
      color: 'var(--text-main)'
    }"
  >
    <div class="mb-4">

      <!-- Original Invoice Row -->
      <div class="flex justify-between mb-2 text-sm" :style="{ color: 'var(--text-sub)' }">
        <div>Original Invoice:</div>
        <div class="font-semibold" :style="{ color: 'var(--text-main)' }">
          {{ returnAgainstValue }} ({{ customerValue }})
        </div>
      </div>

      <!-- Total Return Row -->
      <div
        class="flex justify-between mb-3 text-sm font-semibold pt-2"
        :style="{
          color: 'var(--text-main)',
          borderTop: '1px solid var(--card-border)'
        }"
      >
        <div>{{ __('Total Return') }}</div>
        <div>{{ formatPrice(cartStore.totalPrice) }}</div>
      </div>
    </div>

    <!-- Confirm Return Button -->
    <button
      class="text-white rounded-2xl text-lg w-full py-3 focus:outline-none transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
      :style="{ background: 'var(--btn-danger)' }"
      :disabled="cartStore.isProcessing"
      @click="handleConfirmReturn"
    >
      <ArrowUturnLeftIcon class="w-6 h-6 mr-2 inline-block" />
      {{ __('Confirm Return') }}
    </button>

    <div
      v-if="cartStore.isProcessing"
      class="mt-2 text-sm"
      :style="{ color: 'var(--text-muted)' }"
    >
      {{ __('Process Sales Return') }}
    </div>
  </div>
</template>
<script setup>
import { ref, computed, watch } from 'vue'
import { useCartStore } from '@/stores/cart'
import { ArrowUturnLeftIcon } from '@heroicons/vue/24/outline'
import {formatPrice} from '../../utils/formatters.js'
const cartStore = useCartStore()
const returnAgainstValue = computed(() => cartStore.returnAgainst?.name || 'N/A')
const customerValue = computed(() => cartStore.returnAgainst?.customer || 'N/A')

const handleConfirmReturn = async () => {
  if (cartStore.cart.length === 0) return

  cartStore.isProcessing = true

  try {
    const invoiceName = await cartStore.createSalesReturn(returnAgainstValue.value)

    window.$toast?.success(__('Return Invoice {0} created successfully', [invoiceName]))
    cartStore.clearCart()

  } catch (error) {
    console.error('Return submission failed:', error)
    window.$toast?.error(error.message || __('Failed to create return'))
  } finally {
    cartStore.isProcessing = false
  }
}

</script>
