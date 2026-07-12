import { defineStore } from 'pinia'
import { ref, computed, toRaw } from 'vue'
import { call } from 'frappe-ui'
import { __ } from '@/i18n/index'

const DISCOUNT_ON = {
  NET_TOTAL: 'Net Total',
  GRAND_TOTAL: 'Grand Total',
}

export const useCartStore = defineStore('cart', () => {

  /* ============================================================
     STATE
  ============================================================ */
  const cart = ref([])
  const cash = ref(0)
  const isProcessing = ref(false)

  // ── Payments ───────────────────────────────────────────────
  // [{ mode_of_payment, amount }]
  const payments = ref([])

  // ── Mode ───────────────────────────────────────────────────
  // 'sale'   → normal selling
  // 'return' → creating a return from an existing invoice
  // 'draft'  → editing a saved-but-not-submitted invoice
  const mode = ref('sale')

  // ── References ─────────────────────────────────────────────
  const returnAgainst    = ref(null)
  const currentDraftName = ref(null)
  const currentCustomer  = ref(null)
  const pos_profile_name = ref(null)
  const returndoc        = ref(null)

  const returnInvoiceData = ref(null)

  // ── Tax ────────────────────────────────────────────────────
  const taxLines        = ref([])
  const taxesAndCharges = ref(null)
  const taxCategory     = ref(null)

  // ── Discount ───────────────────────────────────────────────
  const applyDiscountOn              = ref(DISCOUNT_ON.GRAND_TOTAL)
  const additionalDiscountPercentage = ref(0)
  const discountAmount               = ref(0)

  const moneys = [2000, 5000, 10000, 20000, 50000, 100000]

  /* ============================================================
     MODE FLAGS
  ============================================================ */
  const isSaleMode   = computed(() => mode.value === 'sale')
  const isReturnMode = computed(() => mode.value === 'return')
  const isDraftMode  = computed(() => mode.value === 'draft')
  const isReadOnly   = computed(() => isReturnMode.value)

  /* ============================================================
     GETTERS
  ============================================================ */
  const itemsCount = computed(() =>
    cart.value.reduce((total, item) => total + Math.abs(item.qty), 0)
  )

  const netTotal = computed(() =>
    cart.value.reduce((total, item) => total + item.rate * item.qty, 0)
  )

  const subtotal = netTotal

  const taxAmount = computed(() =>
    taxLines.value.reduce((sum, t) => sum + (t.amount || 0), 0)
  )

  const computedDiscountAmount = computed(() => {
    if (discountAmount.value > 0) return discountAmount.value
    if (additionalDiscountPercentage.value <= 0) return 0

    const base = applyDiscountOn.value === DISCOUNT_ON.NET_TOTAL
      ? netTotal.value
      : netTotal.value + taxAmount.value

    return Math.round(base * (additionalDiscountPercentage.value / 100) * 100) / 100
  })

  const totalPrice = computed(() =>
    netTotal.value + taxAmount.value - computedDiscountAmount.value
  )

  const totalPaid = computed(() =>
    payments.value.reduce((sum, p) => sum + (Number(p.amount) || 0), 0)
  )

  const changeAmount = computed(() => totalPaid.value - totalPrice.value)

  const canSubmit = computed(() =>
    cart.value.length > 0 &&
    totalPaid.value >= totalPrice.value &&
    !isProcessing.value
  )

  const isEmpty = computed(() => cart.value.length === 0)

  const cartSummary = computed(() => ({
    itemsCount:       itemsCount.value,
    netTotal:         netTotal.value,
    subtotal:         netTotal.value,
    taxAmount:        taxAmount.value,
    taxLines:         taxLines.value,
    discountAmount:   computedDiscountAmount.value,
    applyDiscountOn:  applyDiscountOn.value,
    additionalDiscountPercentage: additionalDiscountPercentage.value,
    total:            totalPrice.value,
    payments:         payments.value,
    cash:             totalPaid.value,
    change:           changeAmount.value,
    mode:             mode.value,
    customer:         currentCustomer.value,
    taxesAndCharges:  taxesAndCharges.value,
    taxCategory:      taxCategory.value,
  }))

  /* ============================================================
     CART ACTIONS
  ============================================================ */
  const addToCart = (product, barcode = null) => {
    if (isReadOnly.value) {
      window.$toast?.warning(__('Cannot add items in return mode'))
      return false
    }

    const cf         = product.conversion_factor || 1
    const totalStock = product.actual_qty

    const usedQtyInStockUom = cart.value
      .filter(i => i.item_code === product.item_code)
      .reduce((sum, i) => sum + (i.qty * (i.conversion_factor || 1)), 0)

    const newQtyInStockUom = (product.qty || 1) * cf

    if (totalStock != null && usedQtyInStockUom + newQtyInStockUom > totalStock) {
      const available = totalStock - usedQtyInStockUom
      window.$toast?.warning(
        __('Not enough stock. Available: {0} {1}', [available, product.stock_uom])
      )
      return false
    }

    if (product.serial_no) {
      const alreadyInCart = cart.value.find(i => i.serial_no === product.serial_no)
      if (alreadyInCart) {
        window.$toast?.warning(__('Serial {0} already in cart', [product.serial_no]))
        return false
      }
    }

    const existing = cart.value.find(
      i => i.item_code === product.item_code
        && i.uom === product.uom
        && i.serial_no === (product.serial_no || '')
        && i.batch_no  === (product.batch_no  || '')
    )

    if (existing) {
      existing.qty += (product.qty || 1)
    } else {
      cart.value.push({
        item_code:         product.item_code,
        item_name:         product.item_name,
        rate:              product.rate,
        original_rate:     product.original_rate || product.rate,
        image:             product.image  || '',
        barcode:           product.barcode || barcode?.code || '',
        category:          product.item_group || '',
        qty:               product.qty || 1,
        uom:               product.uom || product.stock_uom,
        conversion_factor: cf,
        stock_uom:         product.stock_uom,
        actual_qty:        product.actual_qty,
        serial_no:         product.serial_no  || '',
        batch_no:          product.batch_no   || '',
        addedAt:           new Date().toISOString(),
      })
    }

    return true
  }

  const removeFromCart = (item_code) => {
    if (isReadOnly.value) return
    const index = cart.value.findIndex(i => i.item_code === item_code)
    if (index !== -1) cart.value.splice(index, 1)
  }

  const updateQuantity = (item_code, newQty) => {
    if (isReadOnly.value) {
      window.$toast?.warning(__('Quantity is locked in return mode'))
      return
    }

    const item = cart.value.find(i => i.item_code === item_code)
    if (!item) return

    if (newQty <= 0) {
      removeFromCart(item_code)
      return
    }

    // Stock check (only when we know actual_qty for this item)
    if (item.actual_qty != null) {
      const otherUsage = cart.value
        .filter(i => i.item_code === item_code && i !== item)
        .reduce((sum, i) => sum + (i.qty * (i.conversion_factor || 1)), 0)

      const newQtyInStockUom = newQty * (item.conversion_factor || 1)

      if (otherUsage + newQtyInStockUom > item.actual_qty) {
        const available = item.actual_qty - otherUsage
        window.$toast?.warning(
          __('Not enough stock. Available: {0} {1}', [available, item.stock_uom || ''])
        )
        return
      }
    }

    item.qty = newQty
  }

  const addQuantity = (item_code, amount) => {
    if (isReadOnly.value) return
    const item = cart.value.find(i => i.item_code === item_code)
    if (!item) return
    const newQty = item.qty + amount
    newQty <= 0 ? removeFromCart(item_code) : updateQuantity(item_code, newQty)
  }

  const getCartItem = (item_code) => cart.value.find(i => i.item_code === item_code)
  const isInCart    = (item_code) => cart.value.some(i => i.item_code === item_code)

  const getProductQuantity = (item_code, uom = null) => {
    if (uom) return cart.value.find(i => i.item_code === item_code && i.uom === uom)?.qty ?? 0
    return cart.value
      .filter(i => i.item_code === item_code)
      .reduce((sum, i) => sum + (i.qty * (i.conversion_factor || 1)), 0)
  }

  /* ============================================================
     CASH / PAYMENTS ACTIONS
  ============================================================ */
  const setCash = (amount) => {
    cash.value = Math.max(0, amount)
    if (payments.value.length === 0) {
      payments.value = [{ mode_of_payment: 'Cash', amount: cash.value }]
    } else {
      payments.value[0].amount = cash.value
    }
  }

  const addCash = (amount) => {
    setCash(cash.value + amount)
  }

  const updateCashFromString = (str) => {
    const amount = parseFloat(str.replace(/[^\d.]/g, '')) || 0
    setCash(amount)
  }

  const setPayments = (newPayments) => {
    payments.value = newPayments.map(p => ({
      mode_of_payment: p.mode_of_payment,
      amount: Number(p.amount) || 0,
    }))
    cash.value = totalPaid.value
  }

  /* ============================================================
     TAX ACTIONS
  ============================================================ */
  const applyPOSProfileTax = (taxData) => {
    if (!taxData) return

    taxesAndCharges.value = taxData.taxes_and_charges || null
    taxCategory.value     = taxData.tax_category       || null

    taxLines.value = (taxData.taxes || []).map(t => ({
      account_head: t.account_head,
      description:  t.description || t.account_head,
      rate:         t.rate || 0,
      charge_type:  t.charge_type || 'On Net Total',
      amount:       t.amount ?? 0,
    }))

    recalcTaxLines()
  }

  const recalcTaxLines = () => {
    let runningTotal = netTotal.value
    let previousRowAmount = 0

    taxLines.value = taxLines.value.map((t) => {
      let amount = 0

      switch (t.charge_type) {
        case 'Actual':
          amount = t.amount || 0
          break
        case 'On Net Total':
          amount = Math.round(netTotal.value * (t.rate / 100) * 100) / 100
          break
        case 'On Previous Row Amount':
          amount = Math.round(previousRowAmount * (t.rate / 100) * 100) / 100
          break
        case 'On Previous Row Total':
          amount = Math.round(runningTotal * (t.rate / 100) * 100) / 100
          break
        case 'On Item Quantity':
          amount = Math.round(itemsCount.value * t.rate * 100) / 100
          break
        default:
          amount = Math.round(netTotal.value * (t.rate / 100) * 100) / 100
      }

      previousRowAmount = amount
      runningTotal += amount

      return { ...t, amount }
    })
  }

  const loadTaxLines = (invoiceTaxes = []) => {
    taxLines.value = invoiceTaxes.map(t => ({
      account_head: t.account_head,
      description:  t.description || t.account_head,
      rate:         t.rate || 0,
      amount:       t.tax_amount ?? t.amount ?? 0,
      charge_type:  t.charge_type || 'On Net Total',
    }))
  }

  /* ============================================================
     DISCOUNT ACTIONS
  ============================================================ */
  const setDiscountPercentage = (pct) => {
    additionalDiscountPercentage.value = Math.max(0, Math.min(100, pct))
    discountAmount.value = 0
  }

  const setDiscountAmount = (amount) => {
    discountAmount.value               = Math.max(0, amount)
    additionalDiscountPercentage.value = 0
  }

  const setApplyDiscountOn = (value) => {
    if (Object.values(DISCOUNT_ON).includes(value)) {
      applyDiscountOn.value = value
    }
  }

  const clearDiscount = () => {
    additionalDiscountPercentage.value = 0
    discountAmount.value               = 0
    applyDiscountOn.value              = DISCOUNT_ON.GRAND_TOTAL
  }

  /* ============================================================
     DRAFT MODE ACTIONS
  ============================================================ */
  const loadDraftInvoice = (invoice) => {
    _resetCartState()
    mode.value             = 'draft'
    currentDraftName.value = invoice.name
    currentCustomer.value  = invoice.customer || null

    const loadedPayments = Array.isArray(invoice.payments)
      ? invoice.payments.map(p => ({
          mode_of_payment: p.mode_of_payment,
          amount: Number(p.amount) || 0,
        }))
      : []

    payments.value = loadedPayments
    cash.value = loadedPayments.reduce((sum, p) => sum + p.amount, 0)

    ;(invoice.items || []).forEach(item => {
      cart.value.push({
        item_code:         item.item_code,
        item_name:         item.item_name,
        rate:              item.rate,
        original_rate:     item.rate,
        image:             item.image      || '',
        category:          item.item_group || '',
        qty:               item.qty,
        uom:               item.uom        || item.stock_uom,
        stock_uom:         item.stock_uom,
        conversion_factor: item.conversion_factor || 1,
        actual_qty:        item.actual_qty,
        serial_no:         item.serial_no  || '',
        batch_no:          item.batch_no   || '',
        addedAt:           new Date().toISOString(),
      })
    })

    loadTaxLines(invoice.taxes || [])

    if (invoice.additional_discount_percentage) {
      additionalDiscountPercentage.value = invoice.additional_discount_percentage
    }
    if (invoice.discount_amount) {
      discountAmount.value = invoice.discount_amount
    }
    if (invoice.apply_discount_on) {
      applyDiscountOn.value = invoice.apply_discount_on
    }
  }

  const clearDraftMode = () => {
    mode.value             = 'sale'
    currentDraftName.value = null
  }

  /* ============================================================
     RETURN MODE ACTIONS
  ============================================================ */
  const loadReturnInvoice = (invoice, profile = null) => {
    _resetCartState()
    mode.value = 'return'

    if (profile) pos_profile_name.value = profile

    returnInvoiceData.value = {
      name:            invoice.name,
      customer:        invoice.customer,
      posting_date:    invoice.posting_date,
      grand_total:     invoice.grand_total,
      net_total:       invoice.net_total,
      total_taxes_and_charges: invoice.total_taxes_and_charges,
      discount_amount: invoice.discount_amount,
      additional_discount_percentage: invoice.additional_discount_percentage,
      apply_discount_on: invoice.apply_discount_on,
      taxes:           invoice.taxes    || [],
      payments:        invoice.payments || [],
      remarks:         invoice.remarks  || '',
    }

    returnAgainst.value   = invoice
    currentCustomer.value = invoice.customer || null

    const items = invoice.returnable_items || invoice.items || []

    items.forEach(item => {
      const returnableQty = Math.abs(item.returnable_qty ?? item.qty ?? 0)
      cart.value.push({
        item_code:        item.item_code,
        item_name:        item.item_name,
        rate:             item.rate,
        original_rate:    item.rate,
        image:            item.image      || '',
        category:         item.item_group || '',
        qty:              -returnableQty,
        uom:              item.uom        || item.stock_uom || '',
        stock_uom:        item.stock_uom  || '',
        conversion_factor: item.conversion_factor || 1,
        serial_no:        item.serial_no  || '',
        batch_no:         item.batch_no   || '',
        originalQuantity: returnableQty,
        isReturn:         true,
      })
    })

    loadTaxLines(invoice.taxes || [])

    additionalDiscountPercentage.value = invoice.additional_discount_percentage || 0
    discountAmount.value               = invoice.discount_amount                || 0
    applyDiscountOn.value              = invoice.apply_discount_on              || DISCOUNT_ON.GRAND_TOTAL
  }

  const loadReturnItems = (items = []) => {
    if (mode.value !== 'return') mode.value = 'return'
    items.forEach(it => {
      cart.value.push({
        item_code:        it.item_code || it.id,
        item_name:        it.item_name || it.name,
        rate:             it.rate      || it.price || 0,
        image:            it.image     || '',
        category:         it.category  || '',
        qty:              -Math.abs(it.qty),
        originalQuantity: it.qty       || it.quantity || 1,
        isReturn:         true,
      })
    })
  }

  const createSalesReturn = async (invoice_name) => {
    try {
      console.log("🔍 createSalesReturn")
      console.log("🔍 invoice_name", invoice_name)
      const result =  await call('retail.retail.api.invoice.create_sales_return', {invoice_name})
      console.log("🔍 result", result)
      return result
    } catch (error) {
      console.error('Error creating sales return:', error)
      throw error
    }
  }

  /* ============================================================
     TRANSACTION ACTIONS
  ============================================================ */
  const processTransaction = async (originalInvoice = null) => {
    isProcessing.value = true
    try {
      const transactionData = {
        draftName:     isDraftMode.value ? currentDraftName.value : undefined,
        items:         toRaw(cart.value),
        summary:       cartSummary.value,
        timestamp:     new Date().toISOString(),
        transactionId: _generateTransactionId(),
        customer:      currentCustomer.value,
        mode:          mode.value,
        originalInvoice,
      }
      await _saveTransaction(transactionData)
      return transactionData
    } catch (error) {
      console.error('Transaction failed:', error)
      throw error
    } finally {
      isProcessing.value = false
    }
  }

  /* ============================================================
     CLEAR & RESET
  ============================================================ */
  const _resetCartState = () => {
    cart.value                         = []
    cash.value                         = 0
    payments.value                     = []
    isProcessing.value                 = false
    taxLines.value                     = []
    taxesAndCharges.value              = null
    taxCategory.value                  = null
    additionalDiscountPercentage.value = 0
    discountAmount.value               = 0
    applyDiscountOn.value              = DISCOUNT_ON.GRAND_TOTAL
    returnInvoiceData.value            = null
    currentCustomer.value              = null
  }

  const clearCart = () => {
    _resetCartState()
    mode.value             = 'sale'
    currentDraftName.value = null
  }

  const resetCart = () => {
    clearCart()
    returnAgainst.value    = null
    pos_profile_name.value = null
    returndoc.value        = null
  }

  /* ============================================================
     UTILITIES
  ============================================================ */
  const getChangeBreakdown = () => {
    let remaining = changeAmount.value
    const denominations = [100000, 50000, 20000, 10000, 5000, 2000, 1000, 500, 100, 50, 25, 10, 5, 1]
    const breakdown = []
    for (const denom of denominations) {
      if (remaining >= denom) {
        const count = Math.floor(remaining / denom)
        breakdown.push({ denomination: denom, count })
        remaining -= count * denom
      }
    }
    return breakdown
  }

  /* ============================================================
     PRIVATE HELPERS
  ============================================================ */
  const _generateTransactionId = () => {
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `TXN${Date.now()}${random}`
  }

  const _saveTransaction = async (transactionData) => {
    return new Promise(resolve => {
      setTimeout(() => resolve(transactionData), 500)
    })
  }

  /* ============================================================
     EXPOSE
  ============================================================ */
  return {
    // State
    cart,
    cash,
    payments,
    isProcessing,
    mode,
    currentDraftName,
    currentCustomer,
    returnAgainst,
    pos_profile_name,
    returndoc,
    moneys,
    returnInvoiceData,

    // Tax
    taxLines,
    taxesAndCharges,
    taxCategory,

    // Discount
    applyDiscountOn,
    additionalDiscountPercentage,
    discountAmount,

    // Mode flags
    isSaleMode,
    isReturnMode,
    isDraftMode,
    isReadOnly,

    // Getters
    itemsCount,
    netTotal,
    subtotal,
    taxAmount,
    computedDiscountAmount,
    totalPrice,
    totalPaid,
    changeAmount,
    canSubmit,
    cartSummary,
    isEmpty,

    // Cart
    addToCart,
    removeFromCart,
    updateQuantity,
    addQuantity,
    getCartItem,
    isInCart,
    getProductQuantity,

    // Cash / Payments
    setCash,
    addCash,
    updateCashFromString,
    setPayments,

    // Tax
    applyPOSProfileTax,
    recalcTaxLines,
    loadTaxLines,

    // Discount
    setDiscountPercentage,
    setDiscountAmount,
    setApplyDiscountOn,
    clearDiscount,

    // Draft
    loadDraftInvoice,
    clearDraftMode,

    // Return
    // setReturnAgainst,
    loadReturnInvoice,
    loadReturnItems,
    createSalesReturn,

    // Transaction
    processTransaction,

    // Clear
    clearCart,
    resetCart,

    // Utilities
    getChangeBreakdown,

    // Constants
    DISCOUNT_ON,
  }
})
