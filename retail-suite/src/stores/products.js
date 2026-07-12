import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createSampleItems, deleteSampleItems } from '../services/api'
import { useShiftStore } from './shift'
import { db } from '@/db/indexedDB'
import { isOffline } from '@/db/network'
import { createListResource } from 'frappe-ui'

export const useProductsStore = defineStore('products', () => {

  const products = ref([])
  const allProducts = ref([])
  const priceLists = ref([])
  const warehouses = ref([])
  const itemGroups = ref([])
  const isLoading = ref(false)
  const searchKeyword = ref('')
  const searchContext = ref({})
  const selectedPriceList = ref('')
  const selectedWarehouse = ref('')
  const error = ref(null)

  const filteredProducts = computed(() => {
    if (!searchKeyword.value) return products.value
    const keyword = searchKeyword.value.toLowerCase().trim()
    return products.value.filter(p =>
      p.item_name?.toLowerCase().includes(keyword) ||
      p.item_group?.toLowerCase().includes(keyword) ||
      p.description?.toLowerCase().includes(keyword)
    )
  })

  const productsCount = computed(() => products.value.length)

  const categorizedProducts = computed(() => {
    const categories = {}
    products.value.forEach(product => {
      const category = product.item_group || 'Other'
      if (!categories[category]) categories[category] = []
      categories[category].push(product)
    })
    return categories
  })

  async function loadFilterOptions(pos_profile) {
    try {
      const plResource = createListResource({
        doctype: 'Price List',
        fields: JSON.stringify(['name']),
        filters: { selling: 1, enabled: 1 },
        auto: true,
        limit_page_length: 100,
      })
      await plResource.list.promise

      const whResource = createListResource({
        doctype: 'Warehouse',
        fields: JSON.stringify(['name']),
        filters: { company: pos_profile.company, is_group: 0 },
        auto: true,
        limit_page_length: 100,
      })
      await whResource.list.promise

      priceLists.value = plResource.data || []
      warehouses.value = whResource.data || []

      console.log('➡️ Price Lists:', priceLists.value)
      console.log('➡️ Warehouses:', warehouses.value)
    } catch (e) {
      console.error('❌ loadFilterOptions:', e)
    }
  }

  async function loadProductsFromFrappeDB(forceReload = false) {
    try {
      console.log('========== Load Products ==========')

      if (products.value.length > 0 && !forceReload) {
        console.log('✅ Products already loaded, skipping...')
        return products.value
      }

      if (isOffline.value) {
        console.log('📴 Offline: loading products from IndexedDB')
        products.value = await db.items.toArray()
        return products.value
      }

      const shiftStore = useShiftStore()
      const hasActiveShift = await shiftStore.loadActiveShifts()

      if (!hasActiveShift) {
        console.warn('⚠️ No active shift / POS Profile')
        return []
      }

      const currentPOSProfile = shiftStore.pos_profile
      const posProfileName    = currentPOSProfile.name
      const currentPriceList  = selectedPriceList.value || currentPOSProfile.selling_price_list || null
      const currentWarehouse  = selectedWarehouse.value  || currentPOSProfile.warehouse || null
      const currentCustomer   = currentPOSProfile.customer

      console.log('➡️ POS Profile :', posProfileName)
      console.log('➡️ Price List  :', currentPriceList)
      console.log('➡️ Warehouse   :', currentWarehouse)
      console.log('➡️ Customer    :', currentCustomer)

      if (!posProfileName || !currentPriceList) {
        console.warn('⚠️ Missing required profile details!')
        return []
      }

      isLoading.value = true

      const result = await shiftStore.getItemsFromFrappeDB(
        currentPOSProfile,
        currentPriceList,
        currentCustomer,
        searchKeyword.value,
        currentWarehouse
      )

      products.value = result?.items ?? (Array.isArray(result) ? result : [])
      searchContext.value = result?.search_context ?? {}
      allProducts.value = products.value

      await loadFilterOptions(currentPOSProfile)

      if (!selectedPriceList.value) selectedPriceList.value = currentPriceList
      if (!selectedWarehouse.value) selectedWarehouse.value = currentWarehouse

      console.log('✅ Products loaded:', products.value.length)
      return products.value
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('NetworkError')) {
        console.log('📴 Network error, falling back to IndexedDB')
        products.value = await db.items.toArray()
        return products.value
      }
      console.error('❌ Error loading products:', err)
      return []
    } finally {
      isLoading.value = false
    }
  }

  async function searchProducts(keyword) {
    console.log('🔍 searchProducts called:', keyword)
    if (!keyword || keyword.length < 2) {
      products.value = allProducts.value
      return
    }
    const shiftStore = useShiftStore()
    isLoading.value = true
    const results = await shiftStore.getItemsFromFrappeDB(
      shiftStore.pos_profile,
      selectedPriceList.value || shiftStore.pos_profile.selling_price_list,
      shiftStore.pos_profile.customer,
      keyword,
      selectedWarehouse.value
    )
    products.value = results?.items ?? (Array.isArray(response) ? response : [])
    searchContext.value = results?.search_context ?? {}
    isLoading.value = false
    return results
  }

  async function changePriceList(priceList) {
    selectedPriceList.value = priceList
    await loadProductsFromFrappeDB(true)
  }

  async function changeWarehouse(warehouse) {
    selectedWarehouse.value = warehouse
    await loadProductsFromFrappeDB(true)
  }

  async function createSampleData() {
    const sample_products = [
      { item_code: "SAMPLE-ITEM-001", item_name: "Beef Burger", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/beef-burger.png" },
      { item_code: "SAMPLE-ITEM-002", item_name: "Sandwich", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/sandwich.png" },
      { item_code: "SAMPLE-ITEM-003", item_name: "Shawarma", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/sawarma.png" },
      { item_code: "SAMPLE-ITEM-004", item_name: "Croissant", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/croissant.png" },
      { item_code: "SAMPLE-ITEM-005", item_name: "Cinnamon Roll", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/cinnamon-roll.png" },
      { item_code: "SAMPLE-ITEM-006", item_name: "Choco Donut Peanut", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/choco-glaze-donut-peanut.png" },
      { item_code: "SAMPLE-ITEM-007", item_name: "Choco Glazed", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/choco-glaze-donut.png" },
      { item_code: "SAMPLE-ITEM-008", item_name: "Red Glazed", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/red-glaze-donut.png" },
      { item_code: "SAMPLE-ITEM-009", item_name: "Iced Coffee", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/coffee-latte.png" },
      { item_code: "SAMPLE-ITEM-010", item_name: "Iced Chocolate", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/ice-chocolate.png" },
      { item_code: "SAMPLE-ITEM-011", item_name: "Iced Tea", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/ice-tea.png" },
      { item_code: "SAMPLE-ITEM-012", item_name: "Iced Latte", item_group: "POS ITEM", stock_uom: "Unit", standard_rate: 100, image: "/files/matcha-latte.png" },
    ]
    try {
      await createSampleItems(sample_products)
      window.$toast?.success('✅ Sample items created successfully')
    } catch (e) {
      console.error('error', e)
      window.$toast?.error('❌ Failed to create sample items')
    }
  }

  async function deleteSampleData() {
    try {
      await deleteSampleItems()
      window.$toast?.success('Delete sample items Successfully')
    } catch (e) {
      window.$toast?.error('❌ Failed to Delete sample items')
      console.error('error deleting sample data', e)
    }
  }

  function setSearchKeyword(kw) { searchKeyword.value = kw }
  function clearSearch() { searchKeyword.value = '' }
  function clearError() { error.value = null }

  return {
    // State
    products, allProducts, priceLists, warehouses,
    itemGroups, isLoading, searchKeyword,
    selectedPriceList, selectedWarehouse, error,
    // Getters
    filteredProducts, productsCount, categorizedProducts,
    // Actions
    loadFilterOptions, loadProductsFromFrappeDB,
    searchProducts, changePriceList, changeWarehouse,
    createSampleData, deleteSampleData,
    setSearchKeyword, clearSearch, clearError,
  }
})
