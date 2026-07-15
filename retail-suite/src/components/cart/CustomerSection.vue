<!-- CustomerSection.vue -->
<template>
  <div
    class="p-4 relative"
    :style="{ borderBottom: '1px solid var(--card-border)' }"
    ref="rootEl"
  >
    <div
      class="flex items-stretch rounded-lg overflow-hidden"
      :style="{
        border: '1px solid var(--input-border)',
        background: 'var(--input-bg)'
      }"
    >
      <!-- Customer Search Input -->
      <div class="relative flex-grow">
        <input
          type="text"
          v-model="searchQuery"
          @focus="openDropdown"
          @input="onSearchInput"
          @keydown.down.prevent="moveHighlight(1)"
          @keydown.up.prevent="moveHighlight(-1)"
          @keydown.enter.prevent="selectHighlighted"
          @keydown.esc="closeDropdown"
          :placeholder="__('Search or create customer...')"
          class="w-full h-full p-2 px-3 outline-none transition-all"
          :style="{
            background: 'var(--input-bg)',
            color: 'var(--text-main)',
            border: 'none'
          }"
        />

        <!-- Dropdown -->
        <div
          v-show="isDropdownOpen"
          class="absolute z-20 left-0 right-0 mt-1 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          :style="{
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)'
          }"
        >
          <div
            class="px-3 py-2 cursor-pointer font-semibold flex items-center gap-2"
            :class="{ 'ring-2': highlightedIndex === -1 }"
            :style="{ color: primaryColor }"
            @mousedown.prevent="createNew"
          >
            <span>+</span>
            <span>{{ __('Create New Customer') }}</span>
          </div>

          <div
            v-if="isSearching"
            class="px-3 py-2 text-sm opacity-70"
          >
            {{ __('Searching...') }}
          </div>

          <div
            v-else-if="!customers.length"
            class="px-3 py-2 text-sm opacity-70"
          >
            {{ __('No customers found') }}
          </div>

          <div
            v-for="(cust, idx) in customers"
            :key="cust.name"
            class="px-3 py-2 cursor-pointer transition-all"
            :class="{ 'bg-black/5': highlightedIndex === idx }"
            @mousedown.prevent="selectCustomer(cust)"
          >
            <div class="font-medium">{{ cust.customer_name || cust.name }}</div>
            <div class="text-xs opacity-60" v-if="cust.customer_name && cust.customer_name !== cust.name">
              {{ cust.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- Add Customer Button -->
      <button
        @click="createNew"
        class="flex items-center gap-2 px-3 py-2 font-bold text-white focus:outline-none transition-all whitespace-nowrap shadow-sm"
        :style="{
          background: primaryColor,
          color: '#fff',
          borderLeft: '1px solid var(--card-border)'
        }"
        :title="__('Create New Customer')"
      >
        <svg class="w-5 h-5 font-bold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 4v16m8-8H4" />
        </svg>
        <span class="font-semibold text-sm">{{ __('Customer') }}</span>
      </button>
    </div>
  </div>

  <div class="mb-8">
    <UpdateCustomer
      v-show="showAddCustomerModal"
      :model-value="showAddCustomerModal"
      :customer-id="customerName"
      :customer-info="customer_info"
      :pos_profile_doc="pos_profile"
      :customers="customers"
      :selectedCustomer="selectedCustomer"
      @close="closeCustomerModal"
      @customer-added="handleCustomerUpdated"
      @clickOutside="closeCustomerModal"
      @customer-updated="handleCustomerUpdated"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import UpdateCustomer from '../modals/UpdateCustomer.vue'
import { useShiftStore } from '@/stores/shift.js'
import { useSettingsStore } from '@/stores/settings'
const emit = defineEmits(['customer-selected'])
const settingsStore = useSettingsStore()

const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})

const selectedCustomer = ref('')
const customers = ref([])
const customerName = ref(null)
const customer_info = ref({})
const showAddCustomerModal = ref(false)

const searchQuery = ref('')
const isDropdownOpen = ref(false)
const isSearching = ref(false)
const highlightedIndex = ref(-1)
const rootEl = ref(null)
let debounceTimer = null
let searchToken = 0

const shiftStore = useShiftStore()
const pos_profile = computed(() => shiftStore.pos_profile || {})

const loadCustomers = async (term = '') => {
  const token = ++searchToken
  try {
    isSearching.value = true
    const customersList = await shiftStore.getCustomers(JSON.stringify(pos_profile.value), term)
    // ignore stale responses from an earlier keystroke
    if (token !== searchToken) return customersList
    if (customersList) {
      customers.value = customersList
      return customersList
    } else {
      customers.value = []
      return "skipped"
    }
  } catch (e) {
    console.error('Failed to load customers:', e)
  } finally {
    if (token === searchToken) isSearching.value = false
  }
}

const onSearchInput = () => {
  isDropdownOpen.value = true
  highlightedIndex.value = -1
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    loadCustomers(searchQuery.value.trim())
  }, 300)
}

const openDropdown = () => {
  isDropdownOpen.value = true
  if (!customers.value.length) {
    loadCustomers(searchQuery.value.trim())
  }
}

const closeCustomerModal = () => {
  showAddCustomerModal.value = false
  const currentCustomer = shiftStore.$state.currentCustomer
  if (currentCustomer?.name) {
    applySelectedCustomer(currentCustomer)
  }
}

const closeDropdown = () => {
  isDropdownOpen.value = false
  highlightedIndex.value = -1
}

const handleClickOutside = (e) => {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    closeDropdown()
  }
}

const applySelectedCustomer = (cust) => {
  selectedCustomer.value = cust.name
  customerName.value = cust.name
  customer_info.value = { ...cust }
  searchQuery.value = cust.customer_name || cust.name
}

const selectCustomer = (cust) => {
  applySelectedCustomer(cust)
  emit('customer-selected', cust)
  closeDropdown()
}

const createNew = () => {
  selectedCustomer.value = ''
  customerName.value = null
  customer_info.value = {}
  showAddCustomerModal.value = true
  closeDropdown()
}

const moveHighlight = (delta) => {
  if (!isDropdownOpen.value) {
    isDropdownOpen.value = true
    return
  }
  const max = customers.value.length - 1
  let next = highlightedIndex.value + delta
  if (next < -1) next = max
  if (next > max) next = -1
  highlightedIndex.value = next
}

const selectHighlighted = () => {
  if (highlightedIndex.value === -1) {
    createNew()
  } else if (customers.value[highlightedIndex.value]) {
    selectCustomer(customers.value[highlightedIndex.value])
  }
}

const handleCustomerUpdated = async (updatedCustomer) => {
  const res = await loadCustomers(searchQuery.value.trim())
  const list = Array.isArray(res) ? res : customers.value
  const existingIndex = list.findIndex(c => c.name === updatedCustomer.name)

  if (existingIndex !== -1) {
    customers.value[existingIndex] = { ...updatedCustomer }
  } else {
    customers.value.push({ ...updatedCustomer })
  }

  applySelectedCustomer(updatedCustomer)
  shiftStore.setCustomer(updatedCustomer)
  emit('customer-selected', updatedCustomer)
}

watch(
  () => shiftStore.isShiftOpen,
  async (isOpen) => {
    if (!isOpen) return

    const list = await loadCustomers()
    const customerList = Array.isArray(list) ? list : customers.value

    if (!customerList?.length || !shiftStore.pos_profile?.customer) return

    if (!selectedCustomer.value) {
      const defaultCustomer = customerList.find(
        c => c.name === shiftStore.pos_profile.customer
      )

      if (defaultCustomer) {
        applySelectedCustomer(defaultCustomer)
        shiftStore.setCustomer(defaultCustomer)
        emit('customer-selected', defaultCustomer)
      }
    }
  }
)

onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)

  const list = await loadCustomers()
  const savedCustomer = shiftStore.$state.currentCustomer
  if (savedCustomer?.name && list) {
    const listArr = Array.isArray(list) ? list : customers.value
    const exists = listArr.find(c => c.name === savedCustomer.name)
    if (exists) {
      applySelectedCustomer(exists)
      emit("customer-selected", exists)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearTimeout(debounceTimer)
})
</script>
