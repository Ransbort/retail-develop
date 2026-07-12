<!-- Sections/ReturnInvoicesList.vue -->
<template>
  <div class="flex flex-col gap-4 h-full">

    <!-- Panel header -->
    <div class="flex flex-col gap-0.5 pb-3.5 border-b border-[var(--card-border)]">
      <span class="text-sm font-bold text-[var(--text-main)]">{{ __('Returnable Invoices') }}</span>
      <span class="text-[11px] text-[var(--text-muted)]">{{ __('Select an invoice from the current shift to process a return') }}</span>
    </div>

    <!-- Search -->
    <div class="flex items-center gap-2.5">
      <div class="relative flex-1 min-w-[160px]">
        <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        <input
          v-model="search"
          type="text"
          class="w-full py-1.5 pr-2.5 pl-7 rounded-md text-xs bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--input-border)] outline-none transition-colors focus:border-[var(--focus-ring)]"
          :placeholder="__('Search by invoice number or customer...')"
        />
      </div>
      <span v-if="!loading" class="text-[11px] text-[var(--text-muted)] whitespace-nowrap flex-shrink-0">
        {{ filteredInvoices.length }} {{ __('results') }}
      </span>
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--card-border)] [&::-webkit-scrollbar-thumb]:rounded-full">

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center gap-2.5 py-16 px-5 text-[var(--text-muted)] text-center">
        <div class="w-7.5 h-7.5 rounded-full border-[3px] border-[var(--card-border)] border-t-[var(--warning-border)] animate-spin"></div>
        <span class="text-[13px] text-[var(--text-muted)]">{{ __('Loading invoices...') }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredInvoices.length === 0" class="flex flex-col items-center justify-center gap-2.5 py-16 px-5 text-[var(--text-muted)] text-center">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="opacity-40"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        <p class="text-sm font-semibold text-[var(--text-sub)] m-0">{{ __('No invoices found') }}</p>
        <p class="text-xs text-[var(--text-muted)] m-0">{{ search ? __('Try a different search term') : __('No returnable invoices available for this shift') }}</p>
      </div>

      <!-- Cards -->
      <div v-else class="flex flex-col gap-2">
      <div
        v-for="invoice in filteredInvoices"
        :key="invoice.name"
        class="flex items-start gap-3 p-3.5 rounded-md border cursor-pointer transition-all hover:border-[var(--warning-border)] hover:bg-[var(--warning-bg)]"
        :style="selectedId === invoice.name
          ? 'border: 2px solid var(--warning-border) !important; background: var(--warning-bg) !important;'
          : ''"
        @click="$emit('select', invoice.name)"
      >
          <!-- Radio -->
          <div class="pt-0.5 flex-shrink-0">
            <div
              class="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all"
              :class="selectedId === invoice.name
                ? 'border-[var(--warning-border)] bg-[var(--warning-border)]'
                : 'border-[var(--input-border)] bg-transparent'"
            >
              <div v-if="selectedId === invoice.name" class="w-[7px] h-[7px] rounded-full bg-white"></div>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 min-w-0">
            <div class="mb-2">
              <div class="flex items-center gap-2 mb-1.5 flex-wrap">
                <span class="text-sm font-bold text-[var(--text-main)]">{{ invoice.name }}</span>
                <span v-if="selectedId === invoice.name" class="text-[10px] font-bold text-white px-2 py-0.5 rounded-full tracking-wide bg-[var(--warning-border)]">
                  ✓ {{ __('Selected') }}
                </span>
              </div>
              <div class="flex items-center flex-wrap gap-2.5">
                <span class="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ formatDate(invoice.posting_date) }}
                </span>
                <span class="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
                  {{ invoice.returnable_items?.length || 0 }} {{ __('items') }}
                </span>
                <span v-if="invoice.customer_name" class="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {{ invoice.customer_name }}
                </span>
              </div>
            </div>

            <!-- Item chips -->
            <div v-if="invoice.returnable_items?.length" class="flex flex-wrap gap-1.5 mt-2">
              <span
                v-for="(item, idx) in invoice.returnable_items.slice(0, 3)"
                :key="idx"
                class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[var(--item-bg)] text-[var(--text-sub)] border border-[var(--item-border)]"
              >
                {{ item.item_code }}
                <span class="font-bold text-[var(--text-muted)]">×{{ item.returnable_qty }}</span>
              </span>
              <span v-if="invoice.returnable_items.length > 3" class="inline-flex items-center text-[11px] px-2 py-0.5 rounded-md bg-[var(--card-border)] text-[var(--text-muted)]">
                +{{ invoice.returnable_items.length - 3 }} {{ __('more') }}
              </span>
            </div>
          </div>

          <!-- Amount -->
          <div class="flex flex-col items-end gap-0.5 flex-shrink-0">
            <span class="text-[10px] text-[var(--text-muted)]">{{ __('Total') }}</span>
            <span class="text-[17px] font-bold whitespace-nowrap text-[var(--warning-border)]">{{ formatPrice(invoice.grand_total) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between gap-2.5 pt-3 border-t border-[var(--card-border)] flex-wrap flex-shrink-0">
      <div class="flex items-center gap-1.5 text-xs min-w-0">
        <template v-if="selectedInvoice">
          <span class="text-[var(--text-muted)]">{{ __('Selected') }}:</span>
          <span class="font-bold text-[var(--warning-border)]">{{ selectedInvoice.name }}</span>
          <span class="text-[var(--text-muted)] text-[11px]">— {{ formatPrice(selectedInvoice.grand_total) }}</span>
        </template>
      </div>
      <button
        class="inline-flex items-center justify-center gap-1.5 py-2 px-3.5 rounded-md text-xs font-semibold cursor-pointer border-none transition-opacity bg-[var(--focus-ring)] text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="!selectedId"
        @click="$emit('process-return', selectedInvoice)"
        :style="{
          background: primaryColor,
          color: '#fff',
          borderLeft: '1px solid var(--card-border)'
        }"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
        {{ __('Process Return') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatPrice, formatDate } from '@/utils/formatters'
import { __ } from '@/i18n/index'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  invoices:   { type: Array, default: () => [] },
  loading:    { type: Boolean, default: false },
  selectedId: { type: String, default: null },
})

defineEmits(['select', 'process-return'])

const settingsStore = useSettingsStore()
const primaryColor = computed(() => {
  return settingsStore.settings.appearance.primaryColor || '#06b6d4'
})

const search = ref('')

const filteredInvoices = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.invoices
  return props.invoices.filter(inv =>
    (inv.name || '').toLowerCase().includes(q) ||
    (inv.customer_name || '').toLowerCase().includes(q)
  )
})

const selectedInvoice = computed(() =>
  props.invoices.find(inv => inv.name === props.selectedId) || null
)
</script>
