<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <!-- Backdrop -->
    <div class="absolute inset-0" @click="handleBackgroundClick" />

    <!-- Modal — horizontal two-column layout -->
    <div
      class="relative rounded-xl shadow-2xl w-full max-w-4xl mx-4 flex flex-col lg:flex-row overflow-hidden max-h-[90vh]"
      :style="{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }"
    >

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- LEFT COLUMN — Shift overview + summary                    -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div
        class="flex flex-col lg:w-[42%] flex-shrink-0 border-b lg:border-b-0 lg:border-r"
        :style="{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }"
      >

        <!-- Header -->
        <div
          class="px-5 py-4 flex-shrink-0 bg-gradient-to-br"
          :class="isDark
            ? 'from-red-950/60 to-orange-950/40 border-b border-slate-700'
            : 'from-red-50 to-orange-50 border-b border-slate-200'"
        >
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-3">
              <div :class="isDark ? 'p-2 bg-red-900/60 rounded-lg' : 'p-2 bg-red-100 rounded-lg'">
                <StopIcon class="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 class="text-base font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-900'">{{ __('Close Shift') }}</h3>
                <p class="text-xs" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('End current cashier shift') }}</p>
              </div>
            </div>
            <button
              @click="$emit('close')"
              :disabled="isLoading"
              class="p-1 rounded-lg transition-colors disabled:opacity-40"
              :class="isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'"
            >
              <CloseIcon class="w-5 h-5" />
            </button>
          </div>

          <!-- Cashier / Duration chips -->
          <div class="flex gap-2 flex-wrap">
            <div
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              :class="isDark ? 'bg-slate-800 text-slate-300' : 'bg-white/70 text-slate-700'"
            >
              <span :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ __('Cashier') }}</span>
              <span class="font-semibold">{{ currentShift?.user }}</span>
            </div>
            <div
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              :class="isDark ? 'bg-slate-800 text-slate-300' : 'bg-white/70 text-slate-700'"
            >
              <span :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ __('Duration') }}</span>
              <span class="font-semibold">{{ shiftDuration }}</span>
            </div>
          </div>
        </div>

        <!-- Shift stats -->
        <div class="px-5 py-4 flex-shrink-0 border-b" :class="isDark ? 'border-slate-700/60' : 'border-slate-100'">
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="p-3 rounded-lg" :class="isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50'">
              <div class="text-xs mb-1" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('Transactions') }}</div>
              <div class="text-xl font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-900'">
                {{ currentShift?.transactions.length || 0 }}
              </div>
            </div>
            <div class="p-3 rounded-lg" :class="isDark ? 'bg-green-900/30 border border-green-800/40' : 'bg-green-50'">
              <div class="text-xs mb-1" :class="isDark ? 'text-green-300' : 'text-green-600'">{{ __('Total Sales') }}</div>
              <div class="text-xl font-bold" :class="isDark ? 'text-green-200' : 'text-green-900'">
                {{ formatPrice(currentShift?.totalSales || 0) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Cash reconciliation summary -->
        <div class="px-5 py-4 flex-1 overflow-y-auto">
          <h4 class="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
            :class="isDark ? 'text-slate-400' : 'text-slate-500'">
            <CashIcon class="w-4 h-4 text-green-500" />
            {{ __('Cash Reconciliation') }}
          </h4>
          <div class="space-y-2">
            <!-- Per-mode breakdown from API -->
            <template v-if="paymentSummary.length > 0">
              <div
                v-for="p in paymentSummary"
                :key="p.mode_of_payment"
                class="rounded-lg overflow-hidden border"
                :class="isDark ? 'border-slate-700' : 'border-slate-200'"
              >
                <!-- Mode label bar -->
                <div
                  class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold"
                  :class="isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'"
                >
                  <component :is="mapIcon(p.mode_of_payment)" class="w-3.5 h-3.5" />
                  {{ p.mode_of_payment }}
                </div>
                <!-- Opening + Sales + Expected -->
                <div class="divide-y" :class="isDark ? 'divide-slate-700/50' : 'divide-slate-100'">
                  <div class="flex justify-between items-center px-3 py-1.5 text-xs"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                    <span>{{ __('Opening') }}</span>
                    <span class="font-medium" :class="isDark ? 'text-slate-200' : 'text-slate-700'">
                      {{ formatPrice(p.opening_amount || 0) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center px-3 py-1.5 text-xs"
                    :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                    <span>{{ __('Sales') }}</span>
                    <span class="font-medium" :class="isDark ? 'text-green-300' : 'text-green-700'">
                      {{ formatPrice((p.expected_amount || 0) - (p.opening_amount || 0)) }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center px-3 py-2 text-xs font-semibold"
                    :class="isDark ? 'bg-amber-900/20 text-amber-200' : 'bg-amber-50 text-amber-800'">
                    <span>{{ __('Expected') }}</span>
                    <span class="font-bold">{{ formatPrice(p.expected_amount || 0) }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- Fallback when API hasn't loaded yet -->
            <template v-else>
              <div
                class="flex justify-between items-center px-3 py-2.5 rounded-lg text-sm"
                :class="isDark ? 'bg-blue-900/30 border border-blue-800/40' : 'bg-blue-50'"
              >
                <span :class="isDark ? 'text-blue-300' : 'text-blue-700'">{{ __('Opening Balance') }}</span>
                <span class="font-semibold" :class="isDark ? 'text-blue-200' : 'text-blue-900'">
                  {{ formatPrice(currentShift?.openingBalance || 0) }}
                </span>
              </div>
              <div
                class="flex justify-between items-center px-3 py-2.5 rounded-lg text-sm"
                :class="isDark ? 'bg-green-900/30 border border-green-800/40' : 'bg-green-50'"
              >
                <span :class="isDark ? 'text-green-300' : 'text-green-700'">{{ __('Total Sales') }}</span>
                <span class="font-semibold" :class="isDark ? 'text-green-200' : 'text-green-900'">
                  {{ formatPrice(currentShift?.totalSales || 0) }}
                </span>
              </div>
            </template>

            <!-- Total expected across all modes -->
            <div
              class="flex justify-between items-center px-3 py-2.5 rounded-lg border text-sm font-medium"
              :class="isDark
                ? 'bg-amber-900/30 border-amber-700/50 text-amber-200'
                : 'bg-yellow-50 border-yellow-200 text-yellow-900'"
            >
              <span>{{ __('Total Expected') }}</span>
              <span class="font-bold">{{ formatPrice(expectedCash) }}</span>
            </div>
          </div>

          <!-- Overall difference -->
          <div
            v-if="allModesEntered"
            class="mt-4 p-3 rounded-lg border text-sm"
            :class="cashDifference === 0
              ? (isDark ? 'bg-green-900/30 border-green-700/50' : 'bg-green-50 border-green-200')
              : cashDifference > 0
                ? (isDark ? 'bg-blue-900/30 border-blue-700/50' : 'bg-blue-50 border-blue-200')
                : (isDark ? 'bg-red-900/30 border-red-700/50' : 'bg-red-50 border-red-200')"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CheckIcon v-if="cashDifference === 0" class="w-4 h-4"
                  :class="isDark ? 'text-green-400' : 'text-green-600'" />
                <svg v-else-if="cashDifference > 0" class="w-4 h-4" :class="isDark ? 'text-blue-400' : 'text-blue-600'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <svg v-else class="w-4 h-4" :class="isDark ? 'text-red-400' : 'text-red-600'"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                <span class="font-semibold" :class="getDifferenceTextClass()">{{ getDifferenceLabel() }}</span>
              </div>
              <span class="font-bold text-base" :class="getDifferenceTextClass()">
                {{ formatPrice(Math.abs(cashDifference)) }}
              </span>
            </div>
            <p class="text-xs mt-1.5" :class="getDifferenceDescriptionClass()">
              {{ getDifferenceDescription() }}
            </p>
          </div>

          <!-- Large difference warning -->
          <div
            v-if="hasLargeDifference"
            class="mt-3 p-3 rounded-lg border text-sm"
            :class="isDark ? 'bg-amber-900/30 border-amber-700/50' : 'bg-amber-50 border-amber-200'"
          >
            <div class="flex items-start gap-2">
              <WarningIcon class="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
              <div>
                <p class="font-medium text-xs" :class="isDark ? 'text-amber-300' : 'text-amber-800'">
                  {{ __('Large Cash Difference Detected') }}
                </p>
                <p class="text-xs mt-0.5" :class="isDark ? 'text-amber-400' : 'text-amber-700'">
                  {{ __('Please double-check your count and add a note.') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- RIGHT COLUMN — Payment mode inputs + actions              -->
      <!-- ══════════════════════════════════════════════════════════ -->
      <div class="flex flex-col flex-1 min-h-0 overflow-hidden">

        <!-- Right header -->
        <div
          class="px-5 py-3 flex-shrink-0 border-b"
          :style="{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }"
        >
          <h4 class="text-sm font-semibold flex items-center gap-2"
            :class="isDark ? 'text-slate-200' : 'text-slate-800'">
            <CashIcon class="w-4 h-4 text-green-500" />
            {{ __('Count Closing Balances') }}
          </h4>
          <p class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            {{ __('Enter the actual amount per payment method') }}
          </p>
        </div>

        <!-- Loading state -->
        <div v-if="isSummaryLoading" class="flex-1 flex flex-col items-center justify-center gap-2"
          :class="isDark ? 'text-slate-500' : 'text-slate-400'">
          <LoadingSpinner class="w-6 h-6" />
          <p class="text-sm">{{ __('Loading payment summary…') }}</p>
        </div>

        <!-- Payment modes form -->
        <form
          v-else
          @submit.prevent="getClosingShiftFromOpeningShift"
          class="flex flex-col flex-1 min-h-0 overflow-hidden"
        >
          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-4">

            <!-- Payment mode row -->
            <div
              v-for="pm in displayModes"
              :key="pm.name"
              class="rounded-xl border p-4"
              :class="isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'"
            >
              <!-- Mode header -->
              <div class="flex items-center gap-2 mb-3">
                <component :is="pm.icon" class="w-4 h-4 text-slate-400" />
                <span class="text-sm font-semibold" :class="isDark ? 'text-slate-200' : 'text-slate-800'">
                  {{ pm.name }}
                </span>
                <span v-if="pm.default"
                  class="ml-auto text-[10px] px-1.5 py-0.5 rounded font-medium"
                  :class="isDark ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-100 text-cyan-700'">
                  {{ __('Default') }}
                </span>
              </div>

              <!-- Expected vs Input row -->
              <div class="flex gap-3 items-start">
                <!-- Expected breakdown -->
                <div class="flex-1 p-2.5 rounded-lg text-xs"
                  :class="isDark ? 'bg-amber-900/30 border border-amber-800/40' : 'bg-amber-50'">
                  <div :class="isDark ? 'text-amber-400' : 'text-amber-600'">{{ __('Expected') }}</div>
                  <div class="font-bold mt-0.5 text-sm" :class="isDark ? 'text-amber-200' : 'text-amber-900'">
                    {{ formatPrice(expectedPerMode[pm.name] || 0) }}
                  </div>
                  <!-- Opening / Sales sub-breakdown -->
                  <div v-if="openingAmountPerMode[pm.name] !== undefined" class="mt-1.5 space-y-0.5 border-t pt-1.5"
                    :class="isDark ? 'border-amber-800/40' : 'border-amber-200'">
                    <div class="flex justify-between" :class="isDark ? 'text-amber-400/70' : 'text-amber-600/70'">
                      <span>{{ __('Opening') }}</span>
                      <span>{{ formatPrice(openingAmountPerMode[pm.name] || 0) }}</span>
                    </div>
                    <div class="flex justify-between" :class="isDark ? 'text-amber-400/70' : 'text-amber-600/70'">
                      <span>{{ __('Sales') }}</span>
                      <span>{{ formatPrice((expectedPerMode[pm.name] || 0) - (openingAmountPerMode[pm.name] || 0)) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Actual input -->
                <div class="flex-1">
                  <div class="relative">
                    <span
                      class="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                      :class="isDark ? 'text-slate-400' : 'text-slate-500'"
                    >{{ currency }}</span>
                    <input
                      v-model.number="form.closingBalances[pm.name]"
                      type="number"
                      min="0"
                      step="any"
                      required
                      :placeholder="`Actual ${pm.name}`"
                      :disabled="isLoading"
                      class="w-full pl-10 pr-3 py-2 rounded-lg border text-sm transition-colors disabled:opacity-50"
                      :class="[
                        isDark
                          ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30'
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-400 focus:ring-1 focus:ring-red-200',
                        form.closingBalances[pm.name] !== undefined && form.closingBalances[pm.name] !== ''
                          ? differencePerMode[pm.name] === 0
                            ? 'border-green-400'
                            : Math.abs(differencePerMode[pm.name]) > 10000
                              ? 'border-red-400'
                              : 'border-amber-400'
                          : ''
                      ]"
                    />
                  </div>
                  <!-- Per-mode difference -->
                  <div
                    v-if="form.closingBalances[pm.name] !== undefined && form.closingBalances[pm.name] !== ''"
                    class="mt-1 text-xs font-medium"
                    :class="differencePerMode[pm.name] === 0
                      ? (isDark ? 'text-green-400' : 'text-green-600')
                      : differencePerMode[pm.name] > 0
                        ? (isDark ? 'text-blue-400' : 'text-blue-600')
                        : (isDark ? 'text-red-400' : 'text-red-600')"
                  >
                    {{ differencePerMode[pm.name] === 0
                      ? __('✅ Match')
                      : differencePerMode[pm.name] > 0
                        ? __('▲ Over by') + ' ' + formatPrice(differencePerMode[pm.name])
                        : __('▼ Short by') + ' ' + formatPrice(Math.abs(differencePerMode[pm.name])) }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Closing Notes -->
            <div>
              <label class="block text-xs font-medium mb-1.5"
                :class="isDark ? 'text-slate-300' : 'text-slate-700'">
                {{ __('Closing Notes') }}
                <span class="font-normal" :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ __('(Optional)') }}</span>
              </label>
              <textarea
                v-model="form.notes"
                rows="3"
                :disabled="isLoading"
                :placeholder="__('Notes about cash differences, issues, or observations…')"
                class="w-full px-3 py-2 rounded-lg border text-sm resize-none transition-colors disabled:opacity-50"
                :class="isDark
                  ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-red-400'"
              />
            </div>

            <!-- Error / Success messages -->
            <div v-if="errorMessage"
              class="flex items-center gap-2 p-3 rounded-lg border text-sm"
              :class="isDark ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-50 border-red-200 text-red-800'"
            >
              <AlertIcon class="w-4 h-4 flex-shrink-0 text-red-500" />
              {{ errorMessage }}
            </div>
            <div v-if="successMessage"
              class="flex items-center gap-2 p-3 rounded-lg border text-sm"
              :class="isDark ? 'bg-green-900/30 border-green-700/50 text-green-300' : 'bg-green-50 border-green-200 text-green-800'"
            >
              <CheckIcon class="w-4 h-4 flex-shrink-0 text-green-500" />
              {{ successMessage }}
            </div>
          </div>

          <!-- Footer actions -->
          <div
            class="flex gap-3 px-5 py-4 border-t flex-shrink-0"
            :class="isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'"
          >
            <button
              type="button"
              @click="$emit('close')"
              :disabled="isLoading"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm font-medium border transition-colors disabled:opacity-50"
              :class="isDark
                ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
                : 'border-slate-300 text-slate-700 bg-white hover:bg-slate-50'"
            >
              {{ __('Cancel') }}
            </button>
            <button
              type="submit"
              :disabled="!canSubmit || isLoading"
              class="flex-1 px-4 py-2.5 rounded-lg text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LoadingSpinner v-if="isLoading" class="w-4 h-4" />
              <StopIcon v-else class="w-4 h-4" />
              {{ isLoading ? __('Closing…') : __('Close Shift') }}
            </button>
          </div>
        </form>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { deepUnwrap } from '../../utils/utils'
import { useShiftStore } from '@/stores/shift'
import { useSettingsStore } from '@/stores/settings'
import CashIcon        from '@/components/icons/CashIcon.svg'
import CardIcon        from '@/components/icons/CardIcon.svg'
import PhoneIcon       from '@/components/icons/PhoneIcon.svg'
import CloseIcon       from '@/components/icons/CloseIcon.svg'
import StopIcon        from '@/components/icons/StopIcon.svg'
import WarningIcon     from '@/components/icons/WarningIcon.svg'
import AlertIcon       from '@/components/icons/AlertIcon.svg'
import CheckIcon       from '@/components/icons/CheckIcon.svg'
import LoadingSpinner  from '@/components/icons/LoadingSpinner.vue'
import { formatPrice } from '../../utils/formatters'
import { useConfirm } from '@/composables/useConfirm'

// Returns the actual component object so <component :is="pm.icon"> works
function mapIcon(name = '') {
  switch (name.toLowerCase()) {
    case 'cash':        return CashIcon
    case 'credit card': return CardIcon
    case 'digital':     return PhoneIcon
    default:            return CashIcon
  }
}

const emit = defineEmits(['close', 'success', 'error'])

const shiftStore    = useShiftStore()
const settingsStore = useSettingsStore()
const { confirm }   = useConfirm()

// ── Theme ──────────────────────────────────────────────────────────────────────
const isDark = computed(() => settingsStore.settings?.appearance?.theme === 'dark')

// ── Payment methods from POS profile ──────────────────────────────────────────
const paymentMethods = computed(() =>
  (shiftStore.payment_methods || []).map(pm => ({
    name:    pm.mode_of_payment,
    icon:    mapIcon(pm.mode_of_payment),
    default: pm.default,
  }))
)

// ── Form state ─────────────────────────────────────────────────────────────────
const form = ref({
  closingBalances: {},   // { 'Cash': 500, 'Credit Card': 1200 }
  notes: '',
})

const isLoading       = ref(false)
const errorMessage    = ref('')
const successMessage  = ref('')


// ── Computed ───────────────────────────────────────────────────────────────────
const currency     = computed(() => shiftStore.pos_profile.currency || 'SAR')
const currentShift = computed(() => shiftStore.currentShift)
const isSummaryLoading = computed(() =>
  !currentShift.value || !currentShift.value.payments
)
// ── paymentSummary is the SINGLE SOURCE OF TRUTH for modes + expected amounts ──
// Each entry: { mode_of_payment, opening_amount, expected_amount }
// We enrich it with icon + default flag from the POS profile payment_methods list

const enrichedSummary = computed(() => {
  const profileMethods = shiftStore.payment_methods || []
  return paymentSummary.value.map(p => {
    const profileMatch = profileMethods.find(
      pm => pm.mode_of_payment?.toLowerCase() === p.mode_of_payment?.toLowerCase()
    )
    return {
      name:            p.mode_of_payment,
      opening_amount:  p.opening_amount  || 0,
      expected_amount: p.expected_amount || 0,
      sales_amount:    (p.expected_amount || 0) - (p.opening_amount || 0),
      icon:            mapIcon(p.mode_of_payment),
      default:         profileMatch?.default || false
    }
  })
})

// What to actually render — prefer API-enriched list, fall back to profile list
const displayModes = computed(() =>
  enrichedSummary.value.length > 0
    ? enrichedSummary.value
    : paymentMethods.value.map(pm => ({
        name:            pm.name,
        opening_amount:  0,
        expected_amount: 0,
        sales_amount:    0,
        icon:            pm.icon,
        default:         pm.default,
      }))
)

// Total expected = sum of all expected_amount from API
const expectedCash = computed(() =>
  paymentSummary.value.length > 0
    ? paymentSummary.value.reduce((sum, p) => sum + (p.expected_amount || 0), 0)
    : (currentShift.value?.openingBalance || 0) + (currentShift.value?.totalSales || 0)
)

// Difference per mode: closing entered - expected from API
const differencePerMode = computed(() => {
  const result = {}
  displayModes.value.forEach(p => {
    const entered = Number(form.value.closingBalances[p.name])
    result[p.name] = isNaN(entered) ? null : entered - p.expected_amount
  })
  return result
})

// Total cash difference across all modes (only count modes that have been entered)
const cashDifference = computed(() =>
  Object.values(differencePerMode.value)
    .filter(d => d !== null)
    .reduce((sum, d) => sum + d, 0)
)

// All modes entered = every mode has a valid non-empty value
const allModesEntered = computed(() =>
  displayModes.value.length > 0 &&
  displayModes.value.every(p => {
    const val = form.value.closingBalances[p.name]
    return val !== undefined && val !== '' && val !== null
  })
)

const expectedPerMode = computed(() => {
  const result = {}

  displayModes.value.forEach(mode => {
    result[mode.name] = mode.expected_amount || 0
  })

  return result
})

const openingAmountPerMode = computed(() => {
  const result = {}

  displayModes.value.forEach(mode => {
    result[mode.name] = mode.opening_amount || 0
  })

  return result
})
const hasLargeDifference = computed(() => Math.abs(cashDifference.value) > 50000)

const shiftDuration = computed(() => {
  if (!currentShift.value?.period_start_date) return '0h 0m'
  return shiftStore.formatShiftDuration(currentShift.value)
})

// ✅ FIX: canSubmit only requires all fields filled — differences are allowed
const canSubmit = computed(() =>
  !isLoading.value && allModesEntered.value
)

const paymentSummary = computed(() => currentShift.value?.payments || [])
// ── Difference helpers ─────────────────────────────────────────────────────────
const getDifferenceTextClass = () => {
  const d = cashDifference.value
  if (d === 0) return isDark.value ? 'text-green-400' : 'text-green-800'
  if (d > 0)  return isDark.value ? 'text-blue-400'  : 'text-blue-800'
  return isDark.value ? 'text-red-400' : 'text-red-800'
}

const getDifferenceDescriptionClass = () => {
  const d = cashDifference.value
  if (d === 0) return isDark.value ? 'text-green-500' : 'text-green-700'
  if (d > 0)  return isDark.value ? 'text-blue-500'  : 'text-blue-700'
  return isDark.value ? 'text-red-500' : 'text-red-700'
}

const getDifferenceLabel = () => {
  const d = cashDifference.value
  if (d === 0) return __('Perfect Match!')
  if (d > 0)  return __('Cash Over')
  return __('Cash Short')
}

const getDifferenceDescription = () => {
  const d = cashDifference.value
  if (d === 0) return __('Cash count matches expected amount exactly.')
  if (d > 0)  return __('More cash found than expected. Please verify count.')
  return __('Less cash found than expected. Please recount and check for missing transactions.')
}

// ── Actions ────────────────────────────────────────────────────────────────────
const clearMessages = () => { errorMessage.value = ''; successMessage.value = '' }

const handleBackgroundClick = () => { if (!isLoading.value) emit('close') }

const getClosingShiftFromOpeningShift = async () => {
  try {
    clearMessages()
    isLoading.value = true
    console.log("displayModes",displayModes.value)
    const missingModes = displayModes.value.filter(mop => {
      const val = form.value.closingBalances[mop.name]
      return val === null || val === undefined || val === '' || val < 0
    })
    if (missingModes.length > 0) {
      errorMessage.value = __('Please enter closing balance for: ') + missingModes.map(m => m.name).join(', ')
      return
    }

    if (hasLargeDifference.value) {
      const confirmed = await confirm({
        type: 'confirm',
        title: __('Close Shift'),
        message: __('Large cash difference detected') + ` (${formatPrice(Math.abs(cashDifference.value))}). ` + __('Close anyway?'),
        confirmLabel: __('Close Shift'),
      })
      if (!confirmed) return
    }

    const closing_details = displayModes.value.map(mop => ({
      modeOfPayment:   mop.name,
      closingBalance:  form.value.closingBalances[mop.name] || 0,
      notes:           form.value.notes,
      closedBy:        currentShift.value?.user || 'Unknown',
    }))

    currentShift.value.closing_details = closing_details

    if (!shiftStore.pos_opening_shift) throw new Error('No opening shift found')
    console.log("closing_details",closing_details)
    const closedShift = await shiftStore.closingOpenShift(deepUnwrap(currentShift.value), closing_details)
    successMessage.value = __('Shift closed successfully!')
    setTimeout(() => { emit('success', closedShift); emit('close') }, 1500)

  } catch (e) {
    console.error('Closing shift failed:', e)
    errorMessage.value = e.message || __('Failed to close shift.')
  } finally {
    isLoading.value = false
  }
}
</script>
