<!-- POS.vue -->
<template>
  <div :class="isDark ? 'theme-dark' : 'theme-light'" class="h-screen flex flex-col">
    <!-- Shift Control Bar -->
    <ShiftControl
      @shift-opened="handleShiftOpened"
      @shift-closed="handleShiftClosed"
      @shift-error="handleShiftError"
    />

    <div class="hide-print flex flex-row pl-0 p-4 min-h-0 gap-2 antialiased"
        :style="{
        background: isDark ? 'var(--bg)' : 'var(--card-bg)',
        color: 'var(--text-main)'
      }">

      <!-- Left Sidebar -->
      <Sidebar
        :active-menu="activeMenu"
        @menu-change="handleMenuChange"
      />

      <!-- Main Content -->
      <div class="w-full flex flex-col gap-4">
        

        <div class="flex-1 flex gap-4 h-full">

          <!-- Products Section -->
          <div
            class="flex-grow flex flex-col h-full p-4 gap-2 rounded-xl"
            :style="{
              background: 'var(--content-panel-bg)',
              border: '1px solid var(--content-panel-border)',
              boxShadow: 'var(--content-panel-shadow)'
            }"
          >

          <!-- Customer Bar (full width, above products + cart) -->
        <div
          class="space-y-4 rounded-xl p-4"
          :style="{
            background: 'var(--content-panel-bg)',
            border: '1px solid var(--content-panel-border)',
            boxShadow: 'var(--content-panel-shadow)'
          }"
        >
          <div class="flex items-stretch gap-4">
            <div class="flex-1">
              <CustomerSection
                ref="customerSectionRef"
                :disabled="!!selectedPatient"
                @customer-selected="handleCustomerSelected"
              />
            </div>
            <div class="flex-1">
              <PatientSection
                ref="patientSectionRef"
                :disabled="!!selectedCustomer"
                @patient-selected="handlePatientSelected"
                @prescriptions-loaded="handlePrescriptionsLoaded"
              />
            </div>
          </div>

          <div class="flex flex-1 space-between gap-4">
              <SearchBar class="flex-1" v-model="searchKeyword" />
              <FilterBar
                v-model:selectedPriceList="productsStore.selectedPriceList"
                v-model:selectedWarehouse="productsStore.selectedWarehouse"
                v-model:selectedCategory="selectedStockFilter"
                :price-lists="productsStore.priceLists"
                :warehouses="productsStore.warehouses"
                :is-loading="productsStore.isLoading"
                @reload="productsStore.loadProductsFromFrappeDB(true)" />
            </div>

          
        </div>
          
          <div class="flex-1 p-1 overflow-hidden">
              <ProductGrid :search-keyword="searchKeyword" :stock-filter="selectedStockFilter" />
            </div>
          
          </div>
            

          <!-- Cart Section -->
          <div
            class="w-4/12 flex flex-col h-full py-4 px-3 rounded-xl"
            :style="{
              background: 'var(--sidebar-panel-bg)',
              border: '1px solid var(--sidebar-panel-border)',
              boxShadow: 'var(--sidebar-panel-shadow)'
            }"
          >
            <Cart
              :selected-invoice="selectedInvoice"
              :selected-customer="selectedCustomer"
              :selected-patient="selectedPatient"
              @submit="handleCartSubmit"
              @clear-invoice="handleClearInvoice"
              @item-removed="handleCartItemRemoved"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- First Time Modal -->
  <FirstTimeModal
    v-if="showFirstTimeModal"
    @start-blank="startBlank"
  />

  <!-- Receipt Modal -->
  <ReceiptModal
    v-if="showReceiptModal"
    :receipt-data="receiptData"
    @close="closeReceiptModal"
    @proceed="handleReceiptPrinted"
    @save="handleReceiptSaved"
  />
  <InvoicesDialog
    :show="showInvoicesDialog"
    @close="showInvoicesDialog = false"
    @open-invoice="handleOpenDraftInvoice"
    @delete-draft="handleDeleteDraft"
    @select-return="handleSelectReturn"
  />
	
  <!-- No Shift Overlay -->
  <NoShiftOverlay
    v-if="!shiftStore.isShiftOpen && !isCheckingShift && !showShiftModal && !showOpenShiftModal"
    :primary-color="primaryColor"
    @open="showShiftModal = true"
  />

  <ShiftSelectionModal
    v-if="showShiftModal && shiftStore.availableShifts.length > 0"
    :shifts="shiftStore.availableShifts"
    @select="handleShiftSelected"
    @open-new="() => { showShiftModal = false; showOpenShiftModal = true }"
    @close="showShiftModal = false"
  />

  <OpenShiftModal
    v-if="(showShiftModal && shiftStore.availableShifts.length === 0) || showOpenShiftModal"
    @success="handleShiftOpened"
    @close="showOpenShiftModal = false; showShiftModal = false"
  />

  <!-- Settings Dialog -->
  <SettingsDialog v-model="settingsOpen" />
  <!-- ShiftShowDialog -->
  <ShiftShowDialog v-model="showDialog" :shift-id="shiftStore.currentShift?.name" />

  <BarcodesUnified
    :show="showBarcodes"
    @close="showBarcodes = false"
    @assign="handleAssignBarcode"
    @refresh="loadProductsData"
    @add-to-cart="handleAddToCart"
  />
  <!-- Print Area -->
  <div id="print-area" class="print-area"></div>
</template>

<script setup>
import { Avatar, Button, Dialog, Select, TextInput, call, createDocumentResource } from 'frappe-ui'
import { ref, onMounted, watch, watchEffect, reactive, computed } from 'vue'
import { storeToRefs } from 'pinia'
import ShiftControl from '@/components/shift/ShiftControl.vue'
import Sidebar from '@/layout/Sidebar.vue'
import SearchBar from '@/layout/SearchBar.vue'
import ProductGrid from '@/components/products/ProductGrid.vue'
import Cart from '@/components/cart/Cart.vue'
import CustomerSection from '@/components/cart/CustomerSection.vue'
import PatientSection from '@/components/cart/PatientSection.vue'
import FilterBar from '@/components/products/FilterBar.vue'

import FirstTimeModal from '@/components/modals/FirstTimeModal.vue'
import ReceiptModal from '@/components/modals/ReceiptModal.vue'
import SettingsDialog from '@/components/modals/SettingsDialog.vue'
import { useSettingsStore } from '../stores/settings'
import { useCartStore } from '@/stores/cart'
import { useShiftStore } from '../stores/shift'
import { useInvoicesStore } from '@/stores/invoices'
import ShiftShowDialog from '@/components/modals/ShiftShowDialog.vue'
import BarcodesUnified from '@/components/barcodes/BarcodesUnified.vue'
import InvoicesDialog from '@/components/invoices/InvoicesDialog.vue'
import { useInventoryStore } from '@/stores/inventory'
import { formatPrice } from '../utils/formatters'
import WarningIcon from '@/components/icons/WarningIcon.svg'
import { isOffline } from '@/db/network'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { getBarcodeTypes} from '@/composables/barcode'
import OpenShiftModal from '@/components/modals/OpenShiftModal.vue'
import ShiftSelectionModal from '@/components/modals/ShiftSelectionModal.vue'
import NoShiftOverlay from '@/components/modals/NoShiftOverlay.vue'
import { useProductsStore } from '@/stores/products'

const showBarcodes = ref(false)

const showShiftModal = ref(false)
const hover = ref(false)
const activeMenu = ref('pos')
const searchKeyword = ref('')
const showFirstTimeModal = ref(false)
const showReceiptModal = ref(false)
const showInvoicesDialog = ref(false)
const showOpenShiftModal = ref(false)
const receiptData = ref(null)
const selectedInvoice = ref(null)
const selectedCustomer = ref(null)
const selectedPatient = ref(null)
const patientSectionRef = ref(null)
const customerSectionRef = ref(null)
const selectedStockFilter = ref('all')
const user = ref(null)

const settingsStore = useSettingsStore()
const cartStore = useCartStore()
const shiftStore = useShiftStore()
const invoicesStore = useInvoicesStore()
const inventoryStore = useInventoryStore()
const productsStore = useProductsStore()

const { isShiftOpen } = storeToRefs(shiftStore)
const {mode} = storeToRefs(cartStore)
const isCheckingShift = ref(true)

console.log("🔍 Mode :",mode)


const showDialog = ref(false)
const settingsOpen = ref(false)

const handleShiftOpened = async () => {
  showShiftModal.value = false
  await shiftStore.loadActiveShifts()
  await loadPOSTaxes()
}

// Dark Mode from Settings Store
const settings = computed(() => settingsStore.settings)
const isDark = computed(() => settingsStore.settings.appearance.theme === 'dark')
const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})
// Handle menu change
const handleMenuChange = (menu) => {
  switch (menu) {

    case 'pos':
      cartStore.mode = 'sale'
      activeMenu.value = menu
      selectedInvoice.value = null
      clearCartAndPatient()
      cartStore.isReturn = 0
      break

    case 'settings':
      settingsOpen.value = true
      break

    case 'dialog':
      showDialog.value = true
      break

    case 'barcodesunified':
      activeMenu.value = menu
      showBarcodes.value = !showBarcodes.value
      break

    case 'invoices':
      activeMenu.value = 'return'
      cartStore.mode = 'return'
      cartStore.isReturn = 1
      showInvoicesDialog.value = !showInvoicesDialog.value
      console.log(
        "showInvoicesDialog.value",
        showInvoicesDialog.value
      )
      break
  }
}

const handleAddToCart = (product) => {
  const added = cartStore.addToCart(product)
  if (!added) {
    window.$toast?.warning(__('Quantity exceeds available stock'))
  }
}

// Handle customer selected (from CustomerSection component)
const handleCustomerSelected = (customer) => {
  selectedCustomer.value = customer
  shiftStore.setCustomer(customer)
}

// Handle patient selected (from PatientSection component)
// Selecting a patient outranks customer for billing, same as
// pharmacy_pos.js's patient_field.onchange handler - CustomerSection's
// :disabled prop above already reflects this via `!!selectedPatient`.
const handlePatientSelected = (patient) => {
  selectedPatient.value = patient
  // Changing/clearing the patient means any previously loaded
  // prescriptions belonged to someone else - start tracking fresh.
  loadedPrescriptionIds.value = new Set()
}

// Tracks Medication Request names already added to the cart via "Load
// Prescriptions", so pressing the button again doesn't re-add (and
// re-stack quantity for) the same prescriptions. Reset whenever the
// patient changes (above) or the cart is cleared (clearCartAndPatient).
const loadedPrescriptionIds = ref(new Set())

// If a prescribed item gets manually removed from the cart, forget that
// its Medication Request was "loaded" - otherwise Load Prescriptions would
// permanently skip it for the rest of this patient's visit.
const handleCartItemRemoved = (removedItem) => {
  if (removedItem?.medication_request) {
    loadedPrescriptionIds.value.delete(removedItem.medication_request)
  }
}

// cartStore.clearCart() alone leaves selectedPatient (and selectedCustomer)
// stuck selected - clearCart() is called from 10+ spots below and none of
// them reset either party, so a field would stay disabled and the next
// sale would silently reuse the old patient/customer.
const clearCartAndPatient = () => {
  cartStore.clearCart()
  selectedPatient.value = null
  selectedCustomer.value = null
  loadedPrescriptionIds.value = new Set()
  patientSectionRef.value?.clearPatient()
  customerSectionRef.value?.clearCustomer()
}

// Handle "Load Prescriptions" (from PatientSection component)
// Mirrors add_medication_to_cart() in pharmacy_pos.js: for each pending
// Medication Request, find the matching product, skip if out of stock,
// otherwise add the remaining (un-invoiced) quantity to the cart.
//
// cartStore.addToCart(product, barcode) reads the quantity to add from
// product.qty (defaulting to 1) and checks stock via product.actual_qty,
// NOT stock_qty and NOT a second qty argument - confirmed from cart.js.
// Handle "Load Prescriptions" (from PatientSection component)
// Mirrors add_medication_to_cart() in pharmacy_pos.js: for each pending
// Medication Request, find the linked Item, fetch its price + stock
// FRESH from the backend (rather than trusting whatever's already sitting
// in productsStore.products - that list can be paginated/stale, and its
// pricing is nested under uom_prices[stock_uom], not a flat `rate`, which
// is exactly why prices were coming back as 0 before), then add the
// remaining (un-invoiced) quantity to the cart.
const handlePrescriptionsLoaded = async ({ patient, medicationRequests }) => {
  if (!medicationRequests || medicationRequests.length === 0) {
    window.$toast?.info(__('No pending medication requests found'))
    return
  }

  const priceList = productsStore.selectedPriceList
  const warehouse = productsStore.selectedWarehouse
  const billingCustomer = selectedPatient.value?.customer || selectedCustomer.value?.name || null

  const outOfStock = new Set()
  const notFound = new Set()
  let addedCount = 0
  let alreadyLoadedCount = 0

  for (const req of medicationRequests) {
    if (loadedPrescriptionIds.value.has(req.name)) {
      alreadyLoadedCount++
      continue
    }

    const remainingQty = (req.total_dispensable_quantity || req.quantity) - (req.qty_invoiced || 0)
    if (remainingQty <= 0) continue

    if (!req.medication_item) {
      console.warn(`Medication Request ${req.name} has no linked Item (medication_item)`)
      notFound.add(req.medication)
      continue
    }

    // Cached product (if loaded) just supplies image/item_group for free -
    // price and stock always come fresh from the fetch below.
    const cachedProduct = productsStore.products.find(p => p.item_code === req.medication_item)

    const priceAndStock = await shiftStore.getItemPriceAndStock(
      req.medication_item, priceList, billingCustomer, warehouse
    )

    if (!priceAndStock) {
      console.warn(`Could not fetch price/stock for item ${req.medication_item} (${req.medication})`)
      notFound.add(req.medication)
      continue
    }

    const product = { ...cachedProduct, ...priceAndStock }

    console.log('[Prescription match]', {
      requested_medication: req.medication,
      requested_medication_item: req.medication_item,
      product,
      price_list: priceList,
      warehouse,
      billing_customer: billingCustomer
    })

    if ((product.actual_qty || 0) <= 0) {
      outOfStock.add(req.medication)
      continue
    }

    const added = cartStore.addToCart({
      ...product,
      qty: remainingQty,
      medication_request: req.name,
      // req.medication (e.g. "FUROSIMIDE 20MG INJ (LASIX)") is the full
      // clinical/brand name from the Medication Request - more meaningful
      // for a dispensed drug than product.item_name (the Item master's
      // often-abbreviated name, e.g. "FU20 INJ"). CartItem.vue prefers
      // this field when present.
      medication_name: req.medication,
      dosage_form: req.dosage_form || product.dosage_form,
      dosage: req.dosage,
      period: req.period,
      comment: req.comment
    })

    if (added) {
      addedCount++
      loadedPrescriptionIds.value.add(req.name)
    }
  }

  if (alreadyLoadedCount > 0 && addedCount === 0 && outOfStock.size === 0 && notFound.size === 0) {
    window.$toast?.info(__('All prescriptions already loaded'))
    return
  }

  if (notFound.size > 0) {
    window.$toast?.warning(
      __('Could not find item/price for: {0}', [[...notFound].join(', ')])
    )
  }
  if (outOfStock.size > 0) {
    window.$toast?.warning(
      __('Loaded {0} medication(s). Out of stock: {1}', [addedCount, [...outOfStock].join(', ')])
    )
  } else if (addedCount > 0) {
    window.$toast?.success(__('Loaded {0} medication(s)', [addedCount]))
  }
}

// Handle invoice selected (from Cart component)
const handleInvoiceSelected = (invoice) => {

  clearCartAndPatient()

  if (invoice.returnable_items && invoice.returnable_items.length) {

    const returnedItems = invoice.returnable_items.map(item => ({
      item_code: item.item_code,
      item_name: item.item_name,
      qty: Math.abs(item.returnable_qty), // الكمية سالبة للمرتجع
      rate: item.rate,
      amount: item.amount,
      originalQuantity: item.returnable_qty, // للتحقق من الحد الأقصى
      is_return: true
    }))
    // push returnItems to  cart [] in Cart.js
    cartStore.loadReturnItems(returnedItems)

    // نخلي selectedInvoice.value تحتوي على بيانات أساسية + عناصر للمرتجع فقط
    selectedInvoice.value = {
      name: invoice.name,
      customer: invoice.customer,
      grand_total: invoice.grand_total,
      total_returnable_qty: invoice.total_returnable_qty,
      items: returnedItems // العناصر اللي هترجع
    }

  }
}

const handleCartSubmit = async (transactionData) => {
    try {
      console.log('=== handleCartSubmit Called ===')
      console.log('Transaction Data from Cart:', transactionData)
      console.log('Mode:', transactionData.mode)

      // تحقق من نوع المعاملة
      const isReturn = transactionData.mode === 'return'

      if (isReturn) {
        console.log('🔄 Processing RETURN transaction...')
        await handleReturnTransaction(transactionData)
      } else {
        console.log('💰 Processing SALE transaction...')
        await handleSaleTransaction(transactionData)
      }

    } catch (error) {
      console.error('❌ Error in handleCartSubmit:', error)
      if (window.$toast) {
        window.$toast.error(error.message || 'Failed to process transaction')
      }
    }
}

const handleSaleTransaction = async (transactionData) => {
  try {
    const isFastMode = shiftStore.pos_profile?.fast_mode

    if (isFastMode) {
      // Fast Mode: submit مباشرة
      const invoiceResponse = await invoicesStore.addTransaction(transactionData)

      receiptData.value = {
        ...transactionData,
        invoiceNo: invoiceResponse.invoiceNo,
        invoiceId: invoiceResponse.invoiceNo,
        isFastMode: true,
        isOffline: invoiceResponse.status === 'offline',
        isSaved: invoiceResponse.status? 1 : 0,

      }
    } else {
      // Normal Mode: save draft فقط
      const invoiceResponse = await invoicesStore.saveInvoice(transactionData)
      const savedOk = !!(invoiceResponse?.name)
      receiptData.value = {
        ...transactionData,
        invoiceNo: invoiceResponse.name,
        invoiceId: invoiceResponse.name,
        draftName  : invoiceResponse.name,
        isFastMode: false,
        isOffline: invoiceResponse.status === 'offline',
        isSaved: savedOk
      }
    }

    showReceiptModal.value = true

  } catch (error) {
    console.error('❌ Error in handleSaleTransaction:', error)
    if (window.$toast) window.$toast.error(error.message || 'Failed to process transaction')
  }
}

const handleReturnTransaction = async (returnData) => {
  try {
    console.log('🔄 handleReturnTransaction: Starting...')
    console.log('Return data:', returnData)

    const returnTransaction = {
      ...returnData,
      type: 'return',
      total: -Math.abs(returnData.summary?.total || 0),
      originalInvoice: selectedInvoice.value,
      returnedAt: new Date().toISOString()
    }

    console.log('Return processed successfully')

    if (window.$toast) {
      window.$toast.success(
        `Return processed! Refund: ${formatPrice(Math.abs(returnData.summary?.total || 0))}`
      )
    }

    // نظّف الـ state
    clearCartAndPatient()
    selectedInvoice.value = null
    activeMenu.value = 'pos'

  } catch (error) {
    console.error('❌ Error in handleReturnTransaction:', error)
    throw error
  }
}

const handleOpenDraftInvoice = async (invoiceName) => {
  const doc = createDocumentResource({
    doctype: 'Sales Invoice',
    name: invoiceName,
  })

  await doc.get.fetch()

  if (doc.doc) {
    cartStore.loadDraftInvoice(doc.doc)
    activeMenu.value = 'pos'
  } else {
    window.$toast?.error('Failed to load draft invoice')
  }
}
// Save Copy
const handleReceiptSaved = async (receiptDataParam) => {
  try {
    const result = await invoicesStore.saveInvoice(receiptDataParam)
    if (window.$toast) window.$toast.success(`Invoice ${result.name} saved!`)
    return result
  } catch (error) {
    if (window.$toast) window.$toast.error(error.message || 'Failed to save invoice')
    throw error
  }
  }

// Proceed = Submit
const handleReceiptPrinted = async (receiptDataParam) => {
      console.log('🔍 invoiceId:', receiptDataParam.invoiceId)
      console.log('🔍 isFastMode:', receiptDataParam.isFastMode)

  try {
    if (receiptDataParam.isFastMode) {
      // Fast Mode: الفاتورة اتسبمتت خلاص - مفيش حاجة
      if (window.$toast) window.$toast.success(`Invoice ${receiptDataParam.invoiceNo} completed!`)
    } else {
      // Normal Mode: submit دلوقتي
      await invoicesStore.proceedInvoice(receiptDataParam)
      if (window.$toast) window.$toast.success(`Invoice ${receiptDataParam.invoiceNo} submitted!`)
    }
  } catch (error) {
    if (window.$toast) window.$toast.error(error.message || 'Failed to submit invoice')
  } finally {
    clearCartAndPatient()
    selectedInvoice.value = null
    showReceiptModal.value = false
    activeMenu.value = 'pos'
  }
}

// Handle return processed
const handleReturnProcessed = async (returnData) => {
try {
  console.log('Processing return:', returnData)

  // Add return transaction to shift
  const returnTransaction = {
    ...returnData,
    type: 'return',
    total: -Math.abs(returnData.total), // Negative amount for return
    originalInvoice: selectedInvoice.value
  }

  await invoicesStore.addTransaction(returnTransaction)

  // Save return invoice
  const returnInvoiceData = {
    ...returnData,
    receiptNo: generateReceiptNo('RT'), // RT prefix for returns
    receiptDate: new Date().toISOString(),
    transactionType: 'return',
    originalInvoiceNo: selectedInvoice.value?.receiptNo,
    shiftInfo: {
      cashier: shiftStore.currentShift?.userName,
      shiftId: shiftStore.currentShift?.name
    }
  }

  await invoicesStore.saveInvoice(returnInvoiceData)

  // Show success message
  if (window.$toast) {
    window.$toast.success(`Return processed successfully! Refund: ${formatPrice(Math.abs(returnData.total))}`)
  }

  // Clear cart and selected invoice
  clearCartAndPatient()
  selectedInvoice.value = null

  // Show receipt modal for return
  receiptData.value = returnInvoiceData
  showReceiptModal.value = true

} catch (error) {
  console.error('Error processing return:', error)
  if (window.$toast) {
    window.$toast.error('Failed to process return')
  }
}
}

// Handle return cancelled
const handleReturnCancelled = () => {
  console.log('Return cancelled')
  clearCartAndPatient()
  selectedInvoice.value = null

  if (window.$toast) {
    window.$toast.info('Return process cancelled')
  }
}

const handleShiftClosed = async (shift) => {
  console.log('Shift closed:', shift)
  console.log('Open Closing Shift modal')
  console.log('shift user', shift?.user)

  // Belt-and-suspenders: make sure shift state is actually cleared here too,
  // even if CloseShiftModal already does it - this is what previously left
  // isShiftOpen/pos_profile stale in the persisted store after closing.
  shiftStore.resetShift()

  showOpenShiftModal.value = true
  clearCartAndPatient()
  selectedInvoice.value = null
}

const handleShiftError = (error) => {
  console.error('Shift error:', error)
}

// Start with blank data
const startBlank = () => {
  showFirstTimeModal.value = false
}

// Close receipt modal
const closeReceiptModal = () => {
  showReceiptModal.value = false
  receiptData.value = null
  clearCartAndPatient()
}

// Proceed after print - SAVE INVOICE HERE
const proceedAfterPrint = async (receiptDataParam) => {
  console.log('=== proceedAfterPrint Called ===')
  console.log('Receipt data:', receiptDataParam)

  try {
    // Save invoice to database
    const savedInvoice = await invoicesStore.saveInvoice(receiptDataParam)

    console.log('✅ Invoice saved successfully:', savedInvoice)

    if (savedInvoice) {
      console.log("✅ Saved invoice details:", {
        id: savedInvoice.id,
        receiptNo: savedInvoice.receiptNo,
        invoiceNo: receiptDataParam.invoiceNo
      })

      // ✅ استخدم البيانات الصحيحة
      if (window.$toast) {
        const displayName = receiptDataParam.invoiceNo || savedInvoice.receiptNo || savedInvoice.id
        window.$toast.success(`Invoice ${displayName} saved successfully!`)
      }

      // Clear cart and close modal
      clearCartAndPatient()
      selectedInvoice.value = null
      showReceiptModal.value = false
      activeMenu.value = 'pos'
    }

  } catch (error) {
    console.error('❌ Failed to save invoice:', error)

    // Show error message but still clear cart
    if (window.$toast) {
      window.$toast.error('Failed to save invoice, but transaction was completed')
    }

    clearCartAndPatient()
    selectedInvoice.value = null
    showReceiptModal.value = false
    activeMenu.value = 'pos'
  }
}

// Generate receipt number
const generateReceiptNo = (prefix = 'TW') => {
  const now = new Date()
  const timestamp = now.getTime().toString().slice(-6)
  return `${prefix}${timestamp}`
}

watchEffect(() => {
  const color = settingsStore.settings.appearance.primaryColor
})

onMounted(async () => {

  await shiftStore.loadActiveShifts()

  if (!shiftStore.isShiftOpen) {
    showShiftModal.value = true
  }

  isCheckingShift.value = false
})

const handleShiftSelected = async (shift) => {
  await shiftStore.setActiveShift(shift)
  showShiftModal.value = false
  await loadPOSTaxes()
}

const loadPOSTaxes = async () => {
  const profileName = shiftStore.pos_profile?.name
  console.log("loadPOSTaxes", profileName)
  if (!profileName) return

  try {
    const taxData = await call(
      'retail.retail.api.invoice.get_pos_profile_taxes',
      { pos_profile_name: profileName }
    )
    console.log("taxData", taxData)
    cartStore.applyPOSProfileTax(taxData)
  } catch (e) {
    console.error('Could not load POS taxes:', e)
  }
}
console.log('taxLines:', cartStore.taxLines)
console.log('pos_profile.taxes_and_charges:', shiftStore.pos_profile?.taxes_and_charges)

watch(
  () => settingsStore.settings.appearance.primaryColor,
  (newColor) => {
    console.log('🎨 Primary color changed to:', newColor)
    // الـ Sidebar بتتحدث تلقائياً
  }
)


watch(cartStore.mode, (newMode, oldMode) => {
  console.log('Mode changed:', oldMode, '=>', newMode)

  if (newMode === 'return') {
    // هنا أي logic خاص بالـ return
    console.log('🔍 Return mode')
  }

  if (newMode === 'sale') {
    // هنا أي logic خاص بالـ sale
    console.log('🔍 Sale mode')
  }

  if (newMode === 'draft') {
    // هنا أي logic خاص بالـ draft
    console.log('🔍 Draft mode')
  }
})

// ── Keyboard Shortcuts ─────────────────────────────────────────────────────────
useKeyboardShortcuts({

  onEnter: () => {
    if (!shiftStore.isShiftOpen) return
    if (showReceiptModal.value)  return   // لو الـ modal مفتوح متعملش حاجة
    document.querySelector('[data-submit-cart]')?.click()
  },

  // Escape → إلغاء / إغلاق أي modal مفتوح
  onEscape: () => {
    if (showReceiptModal.value) {
      closeReceiptModal()
      return
    }
    if (showOpenShiftModal.value) {
      showOpenShiftModal.value = false
      return
    }
  },

  // Ctrl+F → فوكس على الـ SearchBar
  onSearch: () => {
    document.querySelector('input[type="search"], input[placeholder*="search" i], input[placeholder*="بحث"]')?.focus()
  },

  // Ctrl+N → كارت جديد (clear)
  onNew: () => {
    if (showReceiptModal.value) return
    clearCartAndPatient()
  },

  // Ctrl+S → حفظ (لو الـ receipt modal مفتوح = save invoice)
  onSave: () => {
    if (showReceiptModal.value && receiptData.value) {
      handleReceiptSaved(receiptData.value)
    }
  },

  // Ctrl+P → طباعة آخر فاتورة
  onPrint: () => {
    if (showReceiptModal.value) {
      // لو الـ modal مفتوح → اطبع الفاتورة الحالية
      document.querySelector('[data-print-btn]')?.click()
    }
  },

})
</script>
