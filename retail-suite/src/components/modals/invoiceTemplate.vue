<!-- :style="{ maxWidth: sizeMap[receipt.receiptSize] || '420px' } -->
 <!-- invoive Template -->
<template>
  <div v-if="receipt" ref="receiptRef" class="inv-wrap">

    <!-- ── HEADER ── -->
    <div class="inv-header" :style="{ background: primaryColor }">
      <div class="inv-header__top">
        <div class="inv-header__info">
          <h1 class="inv-store-name">{{ receipt.company }}</h1>
        </div>
      </div>
      <div class="inv-header__badge">
        <span class="inv-badge-label">{{ receipt.is_return ? __('RETURN') : __('INVOICE') }}</span>
        <span class="inv-badge-num">#{{ receipt.name }}</span>
      </div>
    </div>

    <!-- ── META ROW ── -->
    <div class="inv-meta">
      <div class="inv-meta__item">
        <span class="inv-meta__label">{{ __('Date') }}</span>
        <span class="inv-meta__val">{{ receipt.posting_date }}</span>
      </div>
      <div class="inv-meta__divider"></div>
      <div class="inv-meta__item">
        <span class="inv-meta__label">{{ __('Time') }}</span>
        <span class="inv-meta__val">{{ receipt.posting_time?.slice(0,5) }}</span>
      </div>
      <div class="inv-meta__divider"></div>
      <div class="inv-meta__item">
        <span class="inv-meta__label">{{ __('Cashier') }}</span>
        <span class="inv-meta__val">{{ receipt.owner || '—' }}</span>
      </div>
      <div v-if="receipt.customer_name" class="inv-meta__divider"></div>
      <div v-if="receipt.customer_name" class="inv-meta__item">
        <span class="inv-meta__label">{{ __('Customer') }}</span>
        <span class="inv-meta__val">{{ receipt.customer_name }}</span>
      </div>
    </div>

    <!-- ── ITEMS ── -->
    <div class="inv-items">
      <div class="inv-items__head">
        <span class="inv-items__col--name">{{ __('Item') }}</span>
        <span class="inv-items__col--qty">{{ __('Qty') }}</span>
        <span class="inv-items__col--price">{{ __('Price') }}</span>
        <span class="inv-items__col--total">{{ __('Total') }}</span>
      </div>

      <div
        v-for="(item, i) in receipt.items"
        :key="item.name || i"
        class="inv-items__row"
        :class="{ 'inv-items__row--alt': i % 2 === 1 }"
      >
        <span class="inv-items__col--name">{{ item.item_name }}</span>
        <span class="inv-items__col--qty">{{ item.qty }}</span>
        <span class="inv-items__col--price">{{ formatPrice(item.rate) }}</span>
        <span class="inv-items__col--total inv-items__col--bold">
          {{ formatPrice(item.qty * item.rate) }}
        </span>
      </div>

      <div v-if="!receipt.items?.length" class="inv-items__empty">
        {{ __('No items') }}
      </div>
    </div>

    <!-- ── SUMMARY ── -->
    <div class="inv-summary">
      <div class="inv-summary__row">
        <span>{{ __('Subtotal') }}</span>
        <span>{{ formatPrice(receipt.net_total || 0) }}</span>
      </div>
      <div v-if="(receipt.discount_amount || 0) > 0" class="inv-summary__row inv-summary__row--discount">
        <span>{{ __('Discount') }}</span>
        <span>-{{ formatPrice(receipt.discount_amount) }}</span>
      </div>
      <div v-if="(receipt.total_taxes_and_charges || 0) > 0" class="inv-summary__row">
        <span>{{ __('Tax') }}</span>
        <span>{{ formatPrice(receipt.total_taxes_and_charges) }}</span>
      </div>

      <div class="inv-summary__total">
        <span>{{ __('TOTAL') }}</span>
        <span class="inv-summary__total-val" :style="{ color: primaryColor }">
          {{ formatPrice(receipt.grand_total || 0) }}
        </span>
      </div>

      <div class="inv-summary__payment">
        <div v-for="pm in receipt.payments" :key="pm.name" class="inv-summary__row">
          <span>{{ pm.mode_of_payment }}</span>
          <span>{{ formatPrice(pm.amount) }}</span>
        </div>
        <div v-if="(receipt.change_amount || 0) > 0" class="inv-summary__row inv-summary__row--change">
          <span>{{ __('Change') }}</span>
          <span>{{ formatPrice(receipt.change_amount) }}</span>
        </div>
      </div>
    </div>

    <!-- ── FOOTER ── -->
    <div class="inv-footer">
      <p class="inv-footer__note">{{ __('Thank you for your purchase!') }}</p>
      <div v-if="receipt.tax_id" class="inv-footer__tax">CR: {{ receipt.tax_id }}</div>
      <div class="inv-barcode">
        <div class="inv-barcode__bars">
          <span v-for="n in 40" :key="n" class="inv-barcode__bar"
            :style="{ width: barcodeWidth(n) + 'px', height: n % 5 === 0 ? '28px' : '22px' }">
          </span>
        </div>
        <p class="inv-barcode__num">{{ receipt.name }}</p>
      </div>
    </div>

  </div>
    <div v-else class="inv-loading">
    Loading...
  </div>
</template>
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useReceipt } from '@/composables/useReceipt'
import { useRoute } from 'vue-router'
import { createDocumentResource } from 'frappe-ui'
import { toRaw } from 'vue'

const route = useRoute()
const receipt = ref(null)  // ← ref مش عادي

const { formatPrice } = useReceipt()

const primaryColor = computed(() =>
  getComputedStyle(document.documentElement).getPropertyValue('--primary-500').trim() || '#4f46e5'
)

// ← receipt.value مش receipt مباشرة
const changeAmount = computed(() =>
  Math.max((receipt.value?.paid_amount || 0) - (receipt.value?.grand_total || 0), 0)
)

function barcodeWidth(n) {
  const code = receipt.value?.name || 'INV'  // ← .value
  const char = code.charCodeAt(n % code.length) || 50
  return (char % 3) + 1
}

const receiptRef = ref(null)

const print = async () => {
  if (!receiptRef.value) return
  const win = window.open('', '_blank')
  win.document.write(`<!DOCTYPE html><html><head>
    <title>Invoice ${receipt.value?.name || ''}</title>
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: system-ui, sans-serif; background: #fff; display: flex; justify-content: center; padding: 16px; }
      @media print { body { padding: 0; } @page { margin: 0; } }
    </style>
  </head><body>${receiptRef.value.outerHTML}</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 300)
}

onMounted(async () => {
  const receiptName = route.params.name
  const doc = createDocumentResource({
    doctype: 'Sales Invoice',
    name: receiptName,
  })
  await doc.get.fetch()
  receipt.value = toRaw(doc.doc)  // ← receipt.value مش const receipt
})

defineExpose({ print })
</script>

<style scoped>
/* ── WRAP ── */
.inv-wrap {
  width: 100%;
  max-width: 420px;
  margin: 0 auto;
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 12px;
  color: #111827;
}

/* ── HEADER ── */
.inv-header {
  padding: 18px 20px 14px;
  color: #fff;
}
.inv-header__top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.inv-logo {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.15);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.inv-logo__svg { width: 26px; height: 26px; }
.inv-store-name {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.03em;
  line-height: 1.2;
  color: #fff;
}
.inv-store-sub {
  font-size: 10px;
  opacity: 0.75;
  margin-top: 2px;
  line-height: 1.4;
}
.inv-header__badge {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  background: rgba(0,0,0,0.15);
  border-radius: 7px;
  padding: 6px 12px;
}
.inv-badge-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  opacity: 0.85;
}
.inv-badge-num {
  font-size: 13px;
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

/* ── META ── */
.inv-meta {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  gap: 0;
  overflow-x: auto;
}
.inv-meta__item {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 0 12px;
  flex-shrink: 0;
}
.inv-meta__item:first-child { padding-left: 0; }
.inv-meta__item:last-child  { padding-right: 0; }
.inv-meta__label {
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9ca3af;
}
.inv-meta__val {
  font-size: 11px;
  font-weight: 600;
  color: #111827;
  white-space: nowrap;
}
.inv-meta__divider {
  width: 1px;
  height: 28px;
  background: #e5e7eb;
  flex-shrink: 0;
}

/* ── ITEMS ── */
.inv-items {
  padding: 0 20px;
}
.inv-items__head {
  display: grid;
  grid-template-columns: 1fr 36px 60px 60px;
  gap: 6px;
  padding: 8px 0 6px;
  border-bottom: 1.5px solid #111827;
}
.inv-items__head span {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}
.inv-items__row {
  display: grid;
  grid-template-columns: 1fr 36px 60px 60px;
  gap: 6px;
  padding: 7px 0;
  border-bottom: 1px dashed #e5e7eb;
}
.inv-items__row--alt { background: #f9fafb; margin: 0 -20px; padding: 7px 20px; }
.inv-items__row:last-child { border-bottom: none; }
.inv-items__col--name  { font-size: 11px; color: #111827; }
.inv-items__col--qty   { font-size: 11px; color: #6b7280; text-align: center; }
.inv-items__col--price { font-size: 11px; color: #6b7280; text-align: right; }
.inv-items__col--total { font-size: 11px; text-align: right; }
.inv-items__col--bold  { font-weight: 700; color: #111827; }
.inv-items__empty { padding: 16px 0; text-align: center; color: #9ca3af; font-size: 11px; }

/* ── SUMMARY ── */
.inv-summary {
  padding: 12px 20px 0;
  border-top: 1.5px solid #111827;
  margin: 0 20px;
}
.inv-summary__row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 11px;
  color: #6b7280;
}
.inv-summary__row--discount { color: #10b981; }
.inv-summary__row--change   { color: #10b981; font-weight: 600; }

.inv-summary__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0 8px;
  margin-top: 4px;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
}
.inv-summary__total span:first-child {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #111827;
}
.inv-summary__total-val {
  font-size: 18px;
  font-weight: 700;
}

.inv-summary__payment {
  padding: 8px 0 12px;
}

/* ── FOOTER ── */
.inv-footer {
  padding: 14px 20px 18px;
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  text-align: center;
}
.inv-footer__note {
  font-size: 11px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 4px;
}
.inv-footer__tax {
  font-size: 9px;
  color: #9ca3af;
  margin-bottom: 12px;
}

/* ── BARCODE ── */
.inv-barcode { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.inv-barcode__bars {
  display: flex;
  align-items: flex-end;
  gap: 1.5px;
  height: 32px;
}
.inv-barcode__bar {
  background: #1f2937;
  display: inline-block;
  border-radius: 1px;
}
.inv-barcode__num {
  font-size: 9px;
  letter-spacing: 4px;
  color: #9ca3af;
  font-family: 'Courier New', monospace;
}

/* ── PRINT ── */
@media print {
  .inv-wrap { border: none; border-radius: 0; }
}
</style>
