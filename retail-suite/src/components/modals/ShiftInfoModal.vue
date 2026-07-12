<template>
  <div
    v-if="shift"
    class="fixed inset-0 flex items-center justify-center p-4 z-[9999] bg-black/30"
    :class="isDark ? 'theme-dark' : 'theme-light'">
    <!-- Backdrop -->
   <div class="absolute inset-0 bg-black/25" style="backdrop-filter: blur(2px)" @click="$emit('close')"/>

    <!-- Modal -->
    <div
      class="relative rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
      :style="{ background: 'var(--card-bg)' }"
    >
      <!-- ── Header ──────────────────────────────────────────────── -->
      <div
        class="px-6 py-4 border-b flex-shrink-0"
        :style="{ borderBottomColor: 'var(--card-border)' }"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div :class="isDark ? 'bg-blue-900/60 p-2 rounded-lg' : 'bg-blue-100 p-2 rounded-lg'">
              <InfoIcon class="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 class="text-lg font-semibold" :class="isDark ? 'text-slate-100' : 'text-slate-900'">
                {{ __('Current Shift Details') }}
              </h3>
              <p class="text-sm" :class="isDark ? 'text-slate-400' : 'text-slate-500'">
                {{ __('Shift ID') }}: {{ shift.name }}
              </p>
            </div>
          </div>
          <button
            @click="$emit('close')"
            class="p-1 rounded-lg transition-colors duration-150"
            :class="isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'"
          >
            <CloseIcon class="w-5 h-5" />
          </button>
        </div>
      </div>

      <!-- ── Scrollable Content ───────────────────────────────────── -->
      <div class="overflow-y-auto flex-1 min-h-0 scrollbar-thin"
        :class="isDark ? 'scrollbar-thumb-slate-600 scrollbar-track-slate-800' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'"
      >

        <!-- Basic Information -->
        <div class="px-6 py-5 border-b" :class="isDark ? 'border-slate-700/60' : 'border-slate-100'">
          <h4 class="text-sm font-semibold mb-4 flex items-center gap-2" :class="isDark ? 'text-slate-200' : 'text-slate-800'">
            <UserIcon class="w-5 h-5 text-blue-500" />
            {{ __('Basic Information') }}
          </h4>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <!-- Cashier -->
            <div>
              <span :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('Cashier') }}</span>
              <div class="font-medium mt-0.5" :class="isDark ? 'text-slate-100' : 'text-slate-900'">{{ shift.user }}</div>
              <div class="text-xs mt-0.5" :class="isDark ? 'text-slate-500' : 'text-slate-400'">{{ getUserRole(shift.user) }}</div>
            </div>
            <!-- Status -->
            <div>
              <span :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('Status') }}</span>
              <div class="flex items-center gap-2 mt-1">
                <div
                  class="w-2 h-2 rounded-full flex-shrink-0"
                  :class="shift.status === 'Open' ? 'bg-green-500' : 'bg-red-500'"
                />
                <span
                  class="font-medium capitalize"
                  :class="shift.status === 'Open'
                    ? (isDark ? 'text-green-400' : 'text-green-600')
                    : (isDark ? 'text-red-400' : 'text-red-600')"
                >
                  {{ __(shift.status) }}
                </span>
              </div>
            </div>
            <!-- Started -->
            <div>
              <span :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('Started') }}</span>
              <div class="font-medium mt-0.5" :class="isDark ? 'text-slate-100' : 'text-slate-900'">
                {{ formatDateTime12h(shift.period_start_date) }}
              </div>
            </div>
            <!-- Duration -->
            <div>
              <span :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __("Duration") }}</span>
              <div class="flex items-center gap-1.5 mt-0.5 font-medium" :class="isDark ? 'text-slate-100' : 'text-slate-900'">
                <ClockIcon class="w-4 h-4" :class="isDark ? 'text-slate-400' : 'text-slate-500'" />
                {{ formatDuration(shift) }}
              </div>
            </div>
          </div>
          <!-- Notes -->
          <div v-if="shift.notes" class="mt-4">
            <span class="text-sm" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('Opening Notes') }}</span>
            <div
              class="mt-1 p-2 rounded text-sm"
              :class="isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-50 text-slate-700'"
            >{{ shift.notes }}</div>
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="px-6 py-5 border-b" :class="isDark ? 'border-slate-700/60' : 'border-slate-100'">
          <h4 class="text-sm font-semibold mb-4 flex items-center gap-2" :class="isDark ? 'text-slate-200' : 'text-slate-800'">
            <CashIcon class="w-5 h-5 text-green-500" />
            {{ __('Financial Summary') }}
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <!-- Opening Balance -->
            <div class="p-3 rounded-lg" :class="isDark ? 'bg-blue-900/30 border border-blue-800/50' : 'bg-blue-50'">
              <div class="text-xs mb-1" :class="isDark ? 'text-blue-300' : 'text-blue-600'">{{ __('Opening Balance') }}</div>
              <div class="text-base font-semibold" :class="isDark ? 'text-blue-200' : 'text-blue-900'">
                {{ formatPrice(shift.openingBalance || 0) }}
              </div>
            </div>
            <!-- Total Sales -->
            <div class="p-3 rounded-lg" :class="isDark ? 'bg-green-900/30 border border-green-800/50' : 'bg-green-50'">
              <div class="text-xs mb-1" :class="isDark ? 'text-green-300' : 'text-green-600'">{{ __('Total Sales') }}</div>
              <div class="text-base font-semibold" :class="isDark ? 'text-green-200' : 'text-green-900'">
                {{ formatPrice(shift.totalSales || 0) }}
              </div>
            </div>
            <!-- Expected Cash -->
            <div class="p-3 rounded-lg" :class="isDark ? 'bg-amber-900/30 border border-amber-800/50' : 'bg-yellow-50'">
              <div class="text-xs mb-1" :class="isDark ? 'text-amber-300' : 'text-amber-600'">{{ __('Expected Cash') }}</div>
              <div class="text-base font-semibold" :class="isDark ? 'text-amber-200' : 'text-yellow-900'">
                {{ formatPrice(expectedCash) }}
              </div>
            </div>
            <!-- Avg Transaction -->
            <div class="p-3 rounded-lg" :class="isDark ? 'bg-purple-900/30 border border-purple-800/50' : 'bg-purple-50'">
              <div class="text-xs mb-1" :class="isDark ? 'text-purple-300' : 'text-purple-600'">{{ __('Avg. Transaction') }}</div>
              <div class="text-base font-semibold" :class="isDark ? 'text-purple-200' : 'text-purple-900'">
                {{ formatPrice(averageTransaction) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Transaction Summary -->
        <div class="px-6 py-5 border-b" :class="isDark ? 'border-slate-700/60' : 'border-slate-100'">
          <h4 class="text-sm font-semibold mb-4 flex items-center gap-2" :class="isDark ? 'text-slate-200' : 'text-slate-800'">
            <ReceiptIcon class="w-5 h-5 text-purple-500" />
            {{ __('Transaction Summary') }}
          </h4>
          <div class="grid grid-cols-3 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold" :class="isDark ? 'text-slate-100' : 'text-slate-900'">
                {{ shift.transactions?.length || 0 }}
              </div>
              <div class="text-xs mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('Total') }}</div>
            </div>
            <div>
              <div class="text-2xl font-bold" :class="isDark ? 'text-green-400' : 'text-green-600'">
                {{ completedTransactions }}
              </div>
              <div class="text-xs mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('Completed') }}</div>
            </div>
            <div>
              <div class="text-2xl font-bold" :class="isDark ? 'text-blue-400' : 'text-blue-600'">
                {{ formatPrice(largestTransaction) }}
              </div>
              <div class="text-xs mt-0.5" :class="isDark ? 'text-slate-400' : 'text-slate-500'">{{ __('Largest Sale') }}</div>
            </div>
          </div>
        </div>

        <!-- Recent Transactions -->
        <div class="px-6 py-5">
          <h4 class="text-sm font-semibold mb-4 flex items-center gap-2" :class="isDark ? 'text-slate-200' : 'text-slate-800'">
            <ChartIcon class="w-5 h-5 text-indigo-500" />
            {{ __('Recent Transactions') }}
            <span
              class="ml-1 text-xs px-2 py-0.5 rounded-full"
              :class="isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-600'"
            >
               {{ __('Last',[Math.min(5, recentTransactions.length)]) }}
            </span>
          </h4>

          <div v-if="recentTransactions.length > 0" class="space-y-2">
            <div
              v-for="(transaction, index) in recentTransactions.slice(0, 5)"
              :key="transaction.id"
              class="flex items-center justify-between p-3 rounded-lg text-sm"
              :class="isDark ? 'bg-slate-800/70 border border-slate-700/50' : 'bg-slate-50'"
            >
              <div class="flex items-center gap-3">
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  :class="isDark ? 'bg-blue-900/60' : 'bg-blue-100'"
                >
                  <span class="text-xs font-semibold" :class="isDark ? 'text-blue-300' : 'text-blue-600'">
                    #{{ index + 1 }}
                  </span>
                </div>
                <div>
                  <div class="font-medium" :class="isDark ? 'text-slate-100' : 'text-slate-900'">
                    {{ formatPrice(transaction.grand_total) }}
                  </div>
                  <div class="text-xs" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                    {{ transaction.posting_time }}
                  </div>
                </div>
              </div>
              <div class="text-right">
                <div :class="isDark ? 'text-slate-300' : 'text-slate-600'">{{ __('{0} items',[transaction.total_qty || 0]) }}</div>
                <div class="text-xs capitalize" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
                  {{ transaction.paymentMethod || 'cash' }}
                </div>
              </div>
            </div>
          </div>

          <div v-else class="flex flex-col items-center justify-center py-10" :class="isDark ? 'text-slate-500' : 'text-slate-400'">
            <ReceiptIcon class="w-12 h-12 mb-2 opacity-30" />
            <p class="text-sm">{{ __('No transactions yet') }}</p>
          </div>
        </div>
      </div>

      <!-- ── Footer Actions ──────────────────────────────────────── -->
      <div
        class="px-6 py-4 border-t flex items-center gap-3 flex-shrink-0"
        :class="isDark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'"
      >
        <button
          @click="exportShiftData"
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
        >
          <ExportIcon class="w-4 h-4" />
          {{ __('Export Data') }}
        </button>
        <button
          @click="printShiftSummary"
          class="flex-1 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors duration-150 flex items-center justify-center gap-2"
          :class="isDark ? 'bg-slate-600 hover:bg-slate-500' : 'bg-slate-600 hover:bg-slate-700'"
        >
          <PrintIcon class="w-4 h-4" />
          {{ __('Print Summary') }}
        </button>
        <button
          @click="$emit('close')"
          class="px-5 py-2 rounded-lg text-sm font-medium border transition-colors duration-150"
          :class="isDark
            ? 'border-slate-600 text-slate-300 hover:bg-slate-700'
            : 'border-slate-300 text-slate-700 hover:bg-slate-100'"
        >
          {{ __('Close') }}
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useShiftStore } from '@/stores/shift'
import { useSettingsStore } from '@/stores/settings'
import { formatPrice, formatDateTime12h } from '../../utils/formatters'
import InfoIcon    from '@/components/icons/InfoIcon.svg'
import CloseIcon   from '@/components/icons/CloseIcon.svg'
import UserIcon    from '@/components/icons/UserIcon.svg'
import CashIcon    from '@/components/icons/CashIcon.svg'
import ReceiptIcon from '@/components/icons/ReceiptIcon.svg'
import ChartIcon   from '@/components/icons/ChartIcon.svg'
import ExportIcon  from '@/components/icons/ExportIcon.svg'
import PrintIcon   from '@/components/icons/PrintIcon.svg'
import ClockIcon   from '@/components/icons/ClockIcon.svg'

const props = defineProps({
  shift: { type: Object, required: true }
})
const emit = defineEmits(['close'])

const shiftStore    = useShiftStore()
const settingsStore = useSettingsStore()

// ── Theme ──────────────────────────────────────────────────────────────────────
const isDark = computed(() => settingsStore.settings?.appearance?.theme === 'dark')

// ── Computed ───────────────────────────────────────────────────────────────────
const expectedCash = computed(() =>
  (props.shift.openingBalance || 0) + (props.shift.totalSales || 0)
)

const averageTransaction = computed(() => {
  const total = props.shift.totalTransactions || 0
  const sales = props.shift.totalSales || 0
  return total > 0 ? sales / total : 0
})

const completedTransactions = computed(() =>
  props.shift.transactions?.length || 0
)

const largestTransaction = computed(() => {
  const transactions = props.shift.transactions || []
  return transactions.length > 0
    ? Math.max(...transactions.map(t => t.grand_total || 0))
    : 0
})

const recentTransactions = computed(() =>
  [...(props.shift.transactions || [])].reverse()
)

const formatDuration = (shift) => {
  const start    = new Date(shift.period_start_date)
  const end      = shift.period_end_date ? new Date(shift.period_end_date) : new Date()
  const duration = end.getTime() - start.getTime()
  const hours    = Math.floor(duration / (1000 * 60 * 60))
  const minutes  = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60))
  return `${hours}h ${minutes}m`
}

function getUserRole(userId) {
  const userInfo = shiftStore.$state.CurrentUserInfo
  if (!userInfo || userInfo.user !== userId) return null
  const userRoles  = (userInfo.roles || []).map(r => r.trim().toLowerCase())
  const shiftRoles = ['Cashier', 'System Manager', 'Sales User', 'Administrator'].map(r => r.trim().toLowerCase())
  return userRoles.find(role => shiftRoles.includes(role)) || null
}

// ── Actions ────────────────────────────────────────────────────────────────────
const exportShiftData = async () => {
  try {
    const exportData = await shiftStore.exportShiftData(props.shift.id)
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `shift_${props.shift.id}_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    window.$toast?.success('Shift data exported successfully')
  } catch (error) {
    console.error('Export failed:', error)
    window.$toast?.error('Failed to export shift data')
  }
}

const printShiftSummary = () => {
  const printWindow = window.open('', '_blank')
  printWindow.document.write(generatePrintContent())
  printWindow.document.close()
  printWindow.print()
}

const generatePrintContent = () => `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Shift Summary - ${props.shift.name}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      .header { text-align: center; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background-color: #f2f2f2; }
    </style>
  </head>
  <body>
    <div class="header">
      <h2>Shift Summary</h2>
      <p>Shift ID: ${props.shift.name}</p>
      <p>Date: ${formatDateTime12h(props.shift.period_start_date)}</p>
    </div>
    <p><strong>Cashier:</strong> ${props.shift.user}</p>
    <p><strong>Duration:</strong> ${formatDuration(props.shift)}</p>
    <p><strong>Opening Balance:</strong> ${formatPrice(props.shift.openingBalance || 0)}</p>
    <p><strong>Total Sales:</strong> ${formatPrice(props.shift.totalSales || 0)}</p>
    <p><strong>Total Transactions:</strong> ${props.shift.transactions?.length || 0}</p>
    <table>
      <thead>
        <tr><th>Date</th><th>Time</th><th>Amount</th><th>Items</th><th>Payment</th></tr>
      </thead>
      <tbody>
        ${recentTransactions.value.slice(0, 10).map(t => `
          <tr>
            <td>${t.posting_date}</td>
            <td>${t.posting_time}</td>
            <td>${formatPrice(t.grand_total)}</td>
            <td>${t.total_qty || 0}</td>
            <td>${t.paymentMethod || 'Cash'}</td>
          </tr>`).join('')}
      </tbody>
    </table>
  </body>
  </html>
`
</script>
