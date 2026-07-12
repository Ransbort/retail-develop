// composables/useReceipt.js
import { computed } from 'vue'
import { useShiftStore }    from '@/stores/shift'
import { useSettingsStore } from '@/stores/settings'

export function useReceipt() {
  const shiftStore    = useShiftStore()
  const settingsStore = useSettingsStore()

  // ─── Store info ────────────────────────────────────────────────
  const storeName    = computed(() =>
    settingsStore.settings.store.name    || 'My Store'
  )
  const storeAddress = computed(() =>
    settingsStore.settings.store.address || ''
  )
  const storePhone   = computed(() =>
    settingsStore.settings.store.phone   || ''
  )
  const storeEmail   = computed(() =>
    settingsStore.settings.store.email   || ''
  )
  const taxId        = computed(() =>
    settingsStore.settings.store.taxId   || ''
  )

  // ─── Currency & locale ─────────────────────────────────────────
  // currency تيجي من الـ POS Profile (Frappe) كـ source of truth
  // لو مش موجودة نرجع للـ settings
  const currency = computed(() =>
    shiftStore.pos_profile?.currency ||
    settingsStore.settings.pricing.currency ||
    'SAR'
  )

  const locale = computed(() =>
    settingsStore.settings.store.locale || 'ar-SA'
  )

  // ─── Receipt options ───────────────────────────────────────────
  const showLogo     = computed(() => settingsStore.settings.receipt.showLogo)
  const showThankYou = computed(() => settingsStore.settings.receipt.showThankYou)
  const footerMessage = computed(() => settingsStore.settings.receipt.footerMessage)
  const receiptSize  = computed(() => settingsStore.settings.receipt.size || '80mm')

  // ─── Cashier ───────────────────────────────────────────────────
  const cashier = computed(() =>
    shiftStore.CurrentUserInfo?.full_name ||
    shiftStore.CurrentUserInfo?.user      ||
    ''
  )

  // ─── formatPrice ───────────────────────────────────────────────
  // دالة واحدة بتستخدمها في أي component
  const formatPrice = (amount) => {
    try {
      return new Intl.NumberFormat(locale.value, {
        style                : 'currency',
        currency             : currency.value,
        currencyDisplay      : 'symbol',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount || 0)
    } catch {
      return `${currency.value} ${(amount || 0).toLocaleString()}`
    }
  }

  // ─── formatDate / formatTime ───────────────────────────────────
  const formatDate = (timestamp) => {
    const d = timestamp ? new Date(timestamp) : new Date()
    return d.toLocaleDateString(locale.value, {
      year: 'numeric', month: 'short', day: 'numeric'
    })
  }

  const formatTime = (timestamp) => {
    const d = timestamp ? new Date(timestamp) : new Date()
    return d.toLocaleTimeString(locale.value, {
      hour: '2-digit', minute: '2-digit'
    })
  }

  const buildReceiptData = (transactionData = {}) => ({
    // store
    storeName   : storeName.value,
    storeAddress: storeAddress.value,
    storePhone  : storePhone.value,
    taxId       : taxId.value,
    cashier     : cashier.value,
    // receipt options
    showLogo    : showLogo.value,
    footerNote  : footerMessage.value,
    // currency
    currency    : currency.value,
    // transaction
    invoiceNo     : transactionData.invoiceNo    || '',
    customer      : transactionData.customer     || '',
    items         : transactionData.items        || [],
    summary       : transactionData.summary      || {},
    paymentMethod : transactionData.paymentMethod|| 'Cash',
    timestamp     : transactionData.timestamp    || new Date().toISOString(),
  })

  return {
    storeName,
    storeAddress,
    storePhone,
    storeEmail,
    taxId,
    currency,
    locale,
    showLogo,
    showThankYou,
    footerMessage,
    receiptSize,
    cashier,

    formatPrice,
    formatDate,
    formatTime,
    buildReceiptData,
  }
}
