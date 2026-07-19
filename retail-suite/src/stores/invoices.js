// Store invoice.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createResource } from 'frappe-ui'
import { useShiftStore } from './shift'
import { saveToQueue } from '@/db/sync'
import { isOffline as checkOffline } from '@/db/network'
// ====================================================================
// Resources
// ====================================================================
const saveInvoiceResource = createResource({
  url: 'retail.retail.api.invoice.save_invoice',
  auto: false,
})
/**
 * Sales Invoice
 1-  Normal Mode: (fast mode is 0)
     Normal Mode: saveInvoice → save draft → بعدين proceedInvoice → submit

 2- Fast Mode: (fast mode is 1)
    Fast Mode: addTransaction → submit مباشرة للـ server
 */
const submitInvoiceResource = createResource({
  url: 'retail.retail.api.invoice.submit_invoice',
  auto: false,
})

const getReturnableInvoicesResource = createResource({
  url: 'retail.retail.api.invoice.get_returnable_invoices',
  auto: false,
})

const getPosInvoicesResource = createResource({
  url: 'retail.retail.doctype.pos_closing_shift.pos_closing_shift.get_all_pos_invoices',
  auto: false,
})

export const useInvoicesStore = defineStore('invoices', () => {

  /* ========================
     State
  ======================== */
  const invoices = ref([])
  const draftInvoices = ref([])
  const isLoading = ref(false)
  const currentInvoice = ref(null)
  const cashiers = ref([])

  /* ========================
     Getters (computed)
  ======================== */
  const invoicesCount = computed(() => invoices.value.length)

  const todaysInvoices = computed(() => {
    const today = new Date().toDateString()
    return invoices.value.filter(invoice =>
      new Date(invoice.createdAt).toDateString() === today
    )
  })

  const totalSales = computed(() =>
    invoices.value.reduce((total, invoice) => total + (invoice.summary?.total || 0), 0)
  )

  const todaysSales = computed(() =>
    todaysInvoices.value.reduce((total, invoice) => total + (invoice.summary?.total || 0), 0)
  )

  const averageInvoiceAmount = computed(() =>
    invoices.value.length === 0 ? 0 : totalSales.value / invoices.value.length
  )

  const invoicesStats = computed(() => {
    const total = invoices.value.length
    const today = todaysInvoices.value.length
    const thisMonth = invoices.value.filter(invoice =>
      new Date(invoice.createdAt).getMonth() === new Date().getMonth()
    ).length
    return {
      total,
      today,
      thisMonth,
      totalSales: totalSales.value,
      todaysSales: todaysSales.value,
      averageAmount: averageInvoiceAmount.value,
    }
  })

  /* ========================
     Actions
  ======================== */
  function getInvoicesByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    return invoices.value.filter(invoice => {
      const invoiceDate = new Date(invoice.createdAt).getTime()
      return invoiceDate >= start && invoiceDate <= end
    })
  }

  function getInvoicesByStatus(status) {
    return invoices.value.filter(invoice => invoice.status === status)
  }

  async function allReturnableInvoices() {
    try {
      const result = await getReturnableInvoicesResource.submit()
      console.log('allgetReturnableInvoices', result)
      return result || []
    } catch (error) {
      console.error('Failed to load returnable invoices:', error)
    }
  }

  async function loadInvoices(filters = {}) {
    try {
      isLoading.value = true
      const result = await getPosInvoicesResource.submit({ params: filters })
      invoices.value = (result?.invoices || []).sort((a, b) =>
        new Date(b.createdAt) - new Date(a.createdAt)
      )
      if (invoices.value.length > 0) {
        const cashiersSet = new Set()
        invoices.value.forEach(inv => { if (inv.owner) cashiersSet.add(inv.owner) })
        cashiers.value = Array.from(cashiersSet)
      }
      return invoices.value
    } catch (error) {
      console.error('Failed to load invoices:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function loadDraftInvoices(posOpeningShift) {
    try {
      isLoading.value = true
      const result = await getPosInvoicesResource.submit({
          docstatus: 0,
          pos_opening_shift: posOpeningShift
      })
      draftInvoices.value = (result?.invoices || []).sort((a, b) =>
        new Date(b.modified) - new Date(a.modified)
      )
      return draftInvoices.value
    } catch (error) {
      console.error('Failed to load draft invoices:', error)
    } finally {
      isLoading.value = false
    }
  }

  async function addTransaction(transactionData) {
    try {
      console.log('🔍 Apply Discount On:', transactionData.applyDiscountOn)
      const shiftStore = useShiftStore()

      if (!transactionData?.items?.length) throw new Error('Invalid transaction data - items missing')
      if (!shiftStore.pos_profile) throw new Error('POS Profile not loaded')
      // Use the customer resolved in Cart.vue (patient's linked customer,
      // or the manually selected customer) - NOT shiftStore.currentCustomer,
      // which is only ever populated by the CustomerSection selection path
      // and stays null for patient-only checkouts.
      if (!transactionData?.customer) throw new Error('Customer not selected')

      const { summary, paymentMethod, items, transactionId, mode } = transactionData
      const paidAmount  = parseFloat(summary.cash  ?? 0)
      const totalAmount = parseFloat(summary.total ?? 0)

      const invoicePayload = {
        "doctype": 'Sales Invoice',
        "name": transactionData.draftName || undefined,
        "customer": transactionData.customer,
        "posting_date": new Date().toISOString().slice(0, 10),
        "pos_profile": shiftStore.pos_profile.name,
        "posa_pos_opening_shift": shiftStore.pos_opening_shift?.name,
        "is_pos": 1,
        "ignore_pricing_rule": 1,
        "payments": [{ "mode_of_payment": paymentMethod, "amount": paidAmount }],
        "items": items.map(item => ({
              "item_code": item.item_code,
              "qty": item.qty,
              "rate": item.rate,
              "income_account": shiftStore.pos_profile.income_account,
              "expense_account": shiftStore.pos_profile.expense_account,
              "warehouse": shiftStore.pos_profile.warehouse,
        })),
        "apply_discount_on": transactionData.applyDiscountOn || '',
        "additional_discount_percentage": transactionData.additionalDiscountPercentage || 0,
        "discount_amount": transactionData.discountAmount || 0,
        "taxes_and_charges": shiftStore.pos_profile?.taxes_and_charges || undefined,
        "tax_category": shiftStore.pos_profile?.tax_category || undefined,
        "company": shiftStore.pos_profile.company,
      }
      console.log('🔍 draftName:', transactionData.draftName)
      console.log('🔍 invoicePayload.name:', invoicePayload.name)
      console.log('📋 Invoice Payload:', invoicePayload)

      const dataPayload = {
        "due_date": new Date().toISOString().slice(0, 10),
        transactionId,
        mode,
        redeemed_customer_credit: transactionData.redeemed_customer_credit ?? false,
        customer_credit_dict: transactionData.customer_credit_dict ?? [],
      }

      console.log('📋 Data Payload:', dataPayload)

      // offline mode
      if (checkOffline.value) {
        const offlineId = await saveToQueue(transactionData, 'fast')
        return {
          invoiceNo: offlineId,
          message: 'Invoice saved offline',
          status: 'offline',
          success: true,
        }
      }

      const result = await submitInvoiceResource.submit({
        invoice: JSON.stringify(invoicePayload),
        data: JSON.stringify(dataPayload),
      })

      console.log('📋 Result Api Submit Invoice:', result)
      if (!result?.invoice) throw new Error('Could not get invoice number from response')
      return {
        invoiceNo: result?.invoice,   // invoiceNo: "ACC-SINV-2026-00063"
        message: result?.message,     // message: "Invoice submitted successfully"
        status: result?.status,       // status: "submitted"
        success: result?.success,     // success: "true"
      }

    } catch (error) {
      console.error('❌ addTransaction Error:', error)

      let message = error.message || 'Something went wrong'
      if (submitInvoiceResource.error) {
        const resError = submitInvoiceResource.error
        message = resError.messages?.[0] || resError.message || message
      }

      throw new Error(message)
    }
  }

  async function saveInvoice(transactionData) {
  try {
    console.log('🔍 Apply Discount On (Save Invoice):', transactionData.applyDiscountOn)
    const shiftStore = useShiftStore()
    if (!transactionData?.customer) throw new Error('Customer not selected')
    const { summary, paymentMethod, items } = transactionData
    const paidAmount  = parseFloat(summary.cash  ?? 0)
    const totalAmount = parseFloat(summary.total ?? 0)

    const invoicePayload = {
      "doctype": 'Sales Invoice',
      "name": transactionData.draftName || undefined,  // ←  draft name
      "is_pos": 1,
      "ignore_pricing_rule": 1,
      "company": shiftStore.pos_profile.company,
      "customer": transactionData.customer,
      "posting_date": new Date().toISOString().slice(0, 10),
      "pos_profile": shiftStore.pos_profile.name,
      "payments": [{ mode_of_payment: paymentMethod, amount: paidAmount }],
      "items": items.map(item => ({
        "item_code": item.item_code,
        "qty": item.qty,
        "rate": item.rate,
        "income_account": shiftStore.pos_profile.income_account,
        "expense_account": shiftStore.pos_profile.expense_account,
        "warehouse": shiftStore.pos_profile.warehouse,
      })),
      "apply_discount_on": transactionData.applyDiscountOn || '',
      "additional_discount_percentage": transactionData.additionalDiscountPercentage || 0,
      "discount_amount": transactionData.discountAmount || 0,
      "taxes_and_charges": shiftStore.pos_profile?.taxes_and_charges || undefined,
      "tax_category": shiftStore.pos_profile?.tax_category || undefined,
      "posa_pos_opening_shift": shiftStore.pos_opening_shift?.name,
    }

    const dataPayload = {
      due_date: new Date().toISOString().slice(0, 10),
      redeemed_customer_credit: false,
      customer_credit_dict: [],
    }

    // offline mode
    console.log('checkOffline.value', checkOffline.value)
    if (checkOffline.value) {
      const offlineId = await saveToQueue(transactionData, 'normal')
      return {
        invoiceNo: offlineId,
        message: 'Invoice saved offline',
        status: 'offline',
        success: true,
      }
    }

    const result = await saveInvoiceResource.submit({
      invoice: JSON.stringify(invoicePayload),
      data: JSON.stringify(dataPayload),
    })
    console.log('🔍 result saveInvoice:',result)
    return result

  } catch (error) {
    console.error('❌ saveInvoice Error:', error)
    let message = error.message || 'Something went wrong'
    if (saveInvoiceResource.error) {
      message = saveInvoiceResource.error.messages?.[0] || message
    }
    throw new Error(message)
  }
  }

  async function proceedInvoice(transactionData) {
    try {
      const shiftStore = useShiftStore()
      if (!transactionData?.customer) throw new Error('Customer not selected')
      const { summary, paymentMethod, items, invoiceId } = transactionData
      const paidAmount  = parseFloat(summary.cash  ?? 0)
      const totalAmount = parseFloat(summary.total ?? 0)

      const invoicePayload = {
        doctype: 'Sales Invoice',
        name: invoiceId,  // الـ draft name
        is_pos: 1,
        ignore_pricing_rule: 1,
        company: shiftStore.pos_profile.company,
        naming_series: shiftStore.pos_profile.naming_series,
        customer: transactionData.customer,
        posting_date: new Date().toISOString().slice(0, 10),
        pos_profile: shiftStore.pos_profile.name,
        paymentMethod: paymentMethod,
        payments: [{ mode_of_payment: paymentMethod, amount: paidAmount }],
        items: items.map(item => ({
          item_code: item.item_code,
          qty: item.qty,
          rate: item.rate,
          income_account: shiftStore.pos_profile.income_account,
          expense_account: shiftStore.pos_profile.expense_account,
          warehouse: shiftStore.pos_profile.warehouse,
          ...(item.serial_no && { serial_no: item.serial_no }),
          ...(item.batch_no  && { batch_no:  item.batch_no  }),
          ...(item.uom       && { uom:       item.uom       }),
          ...(item.conversion_factor && { conversion_factor: item.conversion_factor }),
          ...(item.barcode && { barcode: item.barcode })
        })),

        apply_discount_on: transactionData.applyDiscountOn || '',
        additional_discount_percentage: transactionData.additionalDiscountPercentage || 0,
        discount_amount: transactionData.discountAmount || 0,
        taxes_and_charges: shiftStore.pos_profile?.taxes_and_charges || undefined,
        tax_category: shiftStore.pos_profile?.tax_category || undefined,
        posa_pos_opening_shift: shiftStore.pos_opening_shift?.name,
        summary: { cash: paidAmount, total: totalAmount },
      }

      const dataPayload = {
        due_date: new Date().toISOString().slice(0, 10),
        redeemed_customer_credit: false,
        customer_credit_dict: [],
      }

      const result = await submitInvoiceResource.submit({
        invoice: JSON.stringify(invoicePayload),
        data: JSON.stringify(dataPayload),
      })

      return result

    } catch (error) {
      console.error('❌ proceedInvoice Error:', error)
      let message = error.message || 'Something went wrong'
      if (submitInvoiceResource.error) {
        message = submitInvoiceResource.error.messages?.[0] || message
      }
      throw new Error(message)
    }
  }

  async function getInvoiceById(id) {
    try {
      return invoices.value.find(inv => inv.name === id) || null
    } catch (error) {
      console.error('Failed to get invoice:', error)
      return null
    }
  }

  async function deleteInvoice(id) {
    try {
      const invoice = await getInvoiceById(id)
      if (!invoice) throw new Error('Invoice not found')
      const index = invoices.value.findIndex(inv => inv.name === id)
      if (index !== -1) {
        invoices.value[index] = {
          ...invoices.value[index],
          status: 'deleted',
          deletedAt: new Date().toISOString(),
        }
      }
      return true
    } catch (error) {
      console.error('Failed to delete invoice:', error)
      throw error
    }
  }

  function searchInvoices(query) {
    if (!query) return invoices.value
    const searchTerm = query.toLowerCase()
    return invoices.value.filter(invoice =>
      invoice.name?.toLowerCase().includes(searchTerm) ||
      invoice.owner?.toLowerCase().includes(searchTerm) ||
      invoice.customer?.toLowerCase().includes(searchTerm) ||
      invoice.items?.some(item => item.item_code?.toLowerCase().includes(searchTerm))
    )
  }

  function getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timestamp: new Date().toISOString(),
    }
  }

  async function exportInvoices(filters = {}) {
    try {
      let invoicesToExport = [...invoices.value]
      if (filters.startDate && filters.endDate) {
        invoicesToExport = getInvoicesByDateRange(filters.startDate, filters.endDate)
      }
      if (filters.status) {
        invoicesToExport = invoicesToExport.filter(inv => inv.status === filters.status)
      }
      if (filters.cashier) {
        invoicesToExport = invoicesToExport.filter(inv => inv.cashier === filters.cashier)
      }
      return {
        invoices: invoicesToExport,
        summary: {
          totalInvoices: invoicesToExport.length,
          totalAmount: invoicesToExport.reduce((sum, inv) => sum + (inv.summary?.total || 0), 0),
          dateRange: {
            from: invoicesToExport.at(-1)?.createdAt || null,
            to: invoicesToExport.at(0)?.createdAt || null,
          },
        },
        exportedAt: new Date().toISOString(),
        filters,
      }
    } catch (error) {
      console.error('Failed to export invoices:', error)
      throw error
    }
  }

  function getSalesSummary(startDate, endDate) {
    const invoicesInRange = getInvoicesByDateRange(startDate, endDate)
    const summary = {
      totalInvoices: invoicesInRange.length,
      totalSales: invoicesInRange.reduce((sum, inv) => sum + (inv.summary?.total || 0), 0),
      totalTax: invoicesInRange.reduce((sum, inv) => sum + (inv.summary?.tax || 0), 0),
      totalDiscount: invoicesInRange.reduce((sum, inv) => sum + (inv.summary?.discount || 0), 0),
      averageInvoice: 0,
      paymentMethods: {},
      topItems: {},
      dailyBreakdown: {},
    }

    if (summary.totalInvoices > 0) {
      summary.averageInvoice = summary.totalSales / summary.totalInvoices
    }

    invoicesInRange.forEach(invoice => {
      const method = invoice.paymentMethod || 'cash'
      summary.paymentMethods[method] = (summary.paymentMethods[method] || 0) + (invoice.summary?.total || 0)

      invoice.items?.forEach(item => {
        const key = item.item_name
        if (!summary.topItems[key]) summary.topItems[key] = { quantity: 0, revenue: 0 }
        summary.topItems[key].quantity += item.qty
        summary.topItems[key].revenue += item.rate * item.qty
      })

      const date = new Date(invoice.createdAt).toDateString()
      if (!summary.dailyBreakdown[date]) summary.dailyBreakdown[date] = { invoices: 0, sales: 0 }
      summary.dailyBreakdown[date].invoices += 1
      summary.dailyBreakdown[date].sales += invoice.summary?.total || 0
    })

    return summary
  }

  function setCurrentInvoice(invoice) { currentInvoice.value = invoice }
  function getCurrentInvoice() { return currentInvoice.value }

  return {
    // State
    invoices,
    draftInvoices,
    isLoading,
    currentInvoice,
    cashiers,
    // Getters
    invoicesCount,
    todaysInvoices,
    totalSales,
    todaysSales,
    averageInvoiceAmount,
    invoicesStats,
    // Actions
    getInvoicesByDateRange,
    getInvoicesByStatus,
    allReturnableInvoices,
    loadInvoices,
    loadDraftInvoices,
    addTransaction,
    saveInvoice,
    proceedInvoice,
    getInvoiceById,
    deleteInvoice,
    searchInvoices,
    getDeviceInfo,
    exportInvoices,
    getSalesSummary,
    setCurrentInvoice,
    getCurrentInvoice,
  }
})
