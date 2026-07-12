<template>
  <div class="flex flex-col gap-4 h-full">

    <!-- Panel header -->
    <div class="flex flex-col gap-0.5 pb-3.5 border-b border-[var(--card-border)]">
      <span class="text-sm font-bold text-[var(--text-main)]">{{ __('Draft Invoices') }}</span>
      <span class="text-[11px] text-[var(--text-muted)]">{{ __('Invoices saved as draft for the current shift') }}</span>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-2.5 max-[600px]:grid-cols-2">
      <StatsCard :title="__('Drafts')" :value=invoices.length icon="FileText" color="primaryColor" />
      <StatsCard :title="__('Total items')" :value=totalItems icon="Package" color="primaryColor" />
      <StatsCard :title="__('Total amount')" :value=totalAmount icon="BadgeDollarSign" color="primaryColor" />
    </div>


    <!-- Search -->
    <div class="relative w-full">
      <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
      <input
        v-model="search"
        type="text"
        class="w-full py-1.5 pr-2.5 pl-7 rounded-md text-xs bg-[var(--input-bg)] text-[var(--text-main)] border border-[var(--input-border)] outline-none transition-colors focus:border-[var(--focus-ring)]"
        :placeholder="__('Search by invoice number or customer...')"
      />
    </div>

    <!-- List -->
    <div class="flex-1 overflow-y-auto min-h-0 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[var(--card-border)] [&::-webkit-scrollbar-thumb]:rounded-full">

      <!-- Loading -->
      <div v-if="loading" class="flex flex-col items-center justify-center gap-2 py-16 px-5 text-[var(--text-muted)]">
        <div class="w-6.5 h-6.5 rounded-full border-[3px] border-[var(--card-border)] border-t-[var(--warning-border)] animate-spin"></div>
        <span class="text-xs text-[var(--text-muted)]">{{ __('Loading...') }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredInvoices.length === 0" class="flex flex-col items-center justify-center gap-2 py-16 px-5 text-[var(--text-muted)]">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="opacity-35"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
        <p class="text-[13px] font-semibold text-[var(--text-sub)] m-0">{{ __('No draft invoices') }}</p>
        <p class="text-[11px] text-[var(--text-muted)] m-0">{{ search ? __('Try a different search term') : __('No draft invoices for this shift') }}</p>
      </div>

      <!-- Rows -->
      <div v-else class="flex flex-col gap-1.5">
        <div
          v-for="inv in filteredInvoices"
          :key="inv.name"
          class="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] overflow-hidden transition-colors hover:border-[var(--focus-ring)]"
        >
          <!-- Row header -->
          <div class="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-colors hover:bg-[var(--item-bg)]" @click="$emit('toggle', inv.name)">
            <div class="w-7 h-7 rounded-md flex items-center justify-center bg-[var(--info-bg)] text-[var(--focus-ring)] flex-shrink-0">
              <FileText class="w-5 h-5" :style="{color: primaryColor}" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-bold text-[var(--text-main)] whitespace-nowrap overflow-hidden text-ellipsis m-0">{{ inv.name }}</p>
              <p class="text-[11px] text-[var(--text-muted)] flex items-center gap-1 m-0">
                {{ inv.customer }}
                <span class="opacity-40">·</span>
                {{ inv.items_count || inv.items?.length || 0 }} {{ __('items') }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <div class="flex flex-col items-end gap-px">
                <span class="text-xs font-bold text-[var(--text-main)]">{{ formatPrice(inv.grand_total) }}</span>
                <span class="text-[10px] text-[var(--text-muted)]">{{ formatTime(inv.posting_time) }}</span>
              </div>
              <svg
                width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                class="text-[var(--text-muted)] transition-transform duration-200 ease-in-out flex-shrink-0"
                :class="{ 'rotate-180': expandedInvoices.has(inv.name) }"
              ><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>

          <!-- Expanded detail -->
          <Transition
            enter-active-class="transition-all duration-200 ease-in-out"
            leave-active-class="transition-all duration-150 ease-in-out"
            enter-from-class="opacity-0 max-h-0"
            leave-to-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[600px]"
            leave-from-class="opacity-100 max-h-[600px]"
          >
            <div v-if="expandedInvoices.has(inv.name)" class="border-t border-[var(--card-border)] bg-[var(--item-bg)] px-3 py-2.5 flex flex-col gap-2.5 overflow-hidden">

              <!-- Items -->
              <div class="flex flex-col gap-0.5">
                <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-0.5">{{ __('Items') }}</p>
                <div
                  v-for="item in (inv.items || [])"
                  :key="item.name || item.item_code"
                  class="flex justify-between items-center py-1 text-[11px] text-[var(--text-sub)] border-b border-[var(--card-border)] last:border-b-0"
                >
                  <span class="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{{ item.item_name || item.item_code }}</span>
                  <span class="text-[var(--text-muted)] whitespace-nowrap ml-2">{{ item.qty }} × {{ formatPrice(item.rate) }}</span>
                </div>
                <p v-if="!inv.items?.length" class="text-[11px] text-[var(--text-muted)] m-0">{{ __('No item details available') }}</p>
              </div>

              <!-- Tax & Payments -->
              <div v-if="inv.taxes?.length || inv.payments?.length" class="grid grid-cols-2 gap-3 max-[500px]:grid-cols-1">
                <div v-if="inv.taxes?.length" class="flex flex-col gap-0.5">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-0.5">{{ __('Taxes') }}</p>
                  <div
                    v-for="tax in inv.taxes"
                    :key="tax.name || tax.account_head"
                    class="flex justify-between items-center py-1 text-[11px] text-[var(--text-sub)] border-b border-[var(--card-border)] last:border-b-0"
                  >
                    <span class="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{{ tax.description || tax.account_head }}</span>
                    <span class="text-[var(--text-muted)] whitespace-nowrap ml-2">{{ formatPrice(tax.tax_amount) }}</span>
                  </div>
                </div>
                <div v-if="inv.payments?.length" class="flex flex-col gap-0.5">
                  <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] m-0 mb-0.5">{{ __('Payments') }}</p>
                  <div
                    v-for="pay in inv.payments"
                    :key="pay.name || pay.mode_of_payment"
                    class="flex justify-between items-center py-1 text-[11px] text-[var(--text-sub)] border-b border-[var(--card-border)] last:border-b-0"
                  >
                    <span class="flex-1 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">{{ pay.mode_of_payment }}</span>
                    <span class="text-[var(--text-muted)] whitespace-nowrap ml-2">{{ formatPrice(pay.amount) }}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-1.5 pt-1.5 border-t border-[var(--card-border)]">
                <button
                  class="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-[11px] font-semibold cursor-pointer border transition-opacity bg-red-500/[0.08] text-red-500 border-red-500/25 hover:bg-red-500/[0.15]"
                  @click.stop="$emit('delete-draft', inv.name)"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                  {{ __('Delete') }}
                </button>
                <button
                  class="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-md text-[11px] font-semibold cursor-pointer border-none transition-opacity bg-[var(--focus-ring)] text-white hover:opacity-90"
                  @click.stop="$emit('open-invoice', inv.name)"
                  :style="{
                      background: primaryColor,
                      color: '#fff',
                      borderLeft: '1px solid var(--card-border)'
                    }"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  {{ __('Open Invoice') }}
                </button>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { formatPrice } from '@/utils/formatters'
import { __ } from '@/i18n/index'
import { useSettingsStore } from '@/stores/settings'
import { FileText } from 'lucide-vue-next'
import StatsCard from '@/layout/StatsCard.vue'
const props = defineProps({
  invoices:         { type: Array, default: () => [] },
  loading:          { type: Boolean, default: false },
  expandedInvoices: { type: Set, default: () => new Set() },
})

defineEmits(['toggle', 'open-invoice', 'delete-draft'])


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
    (inv.customer || '').toLowerCase().includes(q)
  )
})

const totalItems = computed(() =>
  props.invoices.reduce((s, i) => s + (i.items_count || i.items?.length || 0), 0)
)
const totalAmount = computed(() =>
  props.invoices.reduce((s, i) => s + (i.grand_total || 0), 0)
)

const formatTime = (t) => (t ? String(t).slice(0, 5) : '')
</script>
