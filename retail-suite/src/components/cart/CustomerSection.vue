<!-- CustomerSection.vue -->
<template>
  <div
    class="relative"
    ref="rootEl"
  >
    <input
      type="text"
      v-model="customerSearchQuery"
      @focus="openCustomerDropdown"
      @input="onCustomerSearchInput"
      @keydown.down.prevent="moveCustomerHighlight(1)"
      @keydown.up.prevent="moveCustomerHighlight(-1)"
      @keydown.enter.prevent="selectHighlightedCustomer"
      @keydown.esc="closeCustomerDropdown"
      :disabled="disabled"
      :placeholder="__('Search or create customer...')"
      class="w-full h-full p-4 pr-9 outline-none rounded-3xl text-sm transition-all"
      :style="{
        background: 'var(--input-bg)',
        color: 'var(--text-main)',
        border: 'none',
        opacity: disabled ? 0.5 : 1
      }"
    />

    <button
      v-if="selectedCustomer && !disabled"
      type="button"
      class="absolute right-3 top-1/2 -translate-y-1/2 text-sm opacity-50 hover:opacity-100"
      :title="__('Clear customer')"
      @click="clearCustomer"
    >
      ×
    </button>

    <div
      v-show="isCustomerDropdownOpen"
      class="absolute z-20 left-0 right-0 mt-1 rounded-lg shadow-lg max-h-64 overflow-y-auto"
      :style="{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }"
    >
      <div
        class="px-3 py-2 cursor-pointer font-semibold flex items-center gap-2"
        :class="{ 'ring-2': customerHighlightedIndex === -1 }"
        :style="{ color: primaryColor }"
        @mousedown.prevent="createNewCustomer"
      >
        <span>+</span>
        <span>{{ __('Create New Customer') }}</span>
      </div>

      <div v-if="isSearchingCustomers" class="px-3 py-2 text-sm opacity-70">
        {{ __('Searching...') }}
      </div>
      <div v-else-if="!customers.length" class="px-3 py-2 text-sm opacity-70">
        {{ __('No customers found') }}
      </div>
      <div
        v-for="(cust, idx) in customers"
        :key="cust.name"
        class="px-3 py-2 cursor-pointer transition-all"
        :class="{ 'bg-black/5': customerHighlightedIndex === idx }"
        @mousedown.prevent="selectCustomer(cust)"
      >
        <div class="font-medium">{{ cust.customer_name || cust.name }}</div>
        <div class="text-xs opacity-60" v-if="cust.customer_name && cust.customer_name !== cust.name">
          {{ cust.name }}
        </div>
      </div>
    </div>

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
import { ref, onMounted, onUnmounted, computed } from 'vue'
import UpdateCustomer from '../modals/UpdateCustomer.vue'
import { useShiftStore } from '@/stores/shift.js'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  // Set true when a patient is selected in the sibling PatientSection,
  // since patient billing outranks customer (mirrors pharmacy_pos.js's
  // patient_field.onchange disabling customer_field).
  disabled: { type: Boolean, default: false }
})

const emit = defineEmits(['customer-selected'])

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => settings.value?.appearance?.primaryColor || '#06b6d4')

const shiftStore = useShiftStore()
const pos_profile = computed(() => shiftStore.pos_profile || {})

const rootEl = ref(null)

const selectedCustomer = ref('')
const customers = ref([])
const customerName = ref(null)
const customer_info = ref({})
const showAddCustomerModal = ref(false)

const customerSearchQuery = ref('')
const isCustomerDropdownOpen = ref(false)
const isSearchingCustomers = ref(false)
const customerHighlightedIndex = ref(-1)
let customerDebounceTimer = null
let customerSearchToken = 0

const loadCustomers = async (term = '') => {
  const token = ++customerSearchToken
  try {
    isSearchingCustomers.value = true
    const list = await shiftStore.getCustomers(JSON.stringify(pos_profile.value), term)
    if (token !== customerSearchToken) return list
    customers.value = list || []
    return list || 'skipped'
  } catch (e) {
    console.error('Failed to load customers:', e)
  } finally {
    if (token === customerSearchToken) isSearchingCustomers.value = false
  }
}

const onCustomerSearchInput = () => {
  isCustomerDropdownOpen.value = true
  customerHighlightedIndex.value = -1
  clearTimeout(customerDebounceTimer)
  customerDebounceTimer = setTimeout(() => {
    loadCustomers(customerSearchQuery.value.trim())
  }, 300)
}

const openCustomerDropdown = () => {
  if (props.disabled) return
  isCustomerDropdownOpen.value = true
  if (!customers.value.length) loadCustomers(customerSearchQuery.value.trim())
}

const closeCustomerDropdown = () => {
  isCustomerDropdownOpen.value = false
  customerHighlightedIndex.value = -1
}

const closeCustomerModal = () => {
  showAddCustomerModal.value = false
  const currentCustomer = shiftStore.$state.currentCustomer
  if (currentCustomer?.name) applySelectedCustomer(currentCustomer)
}

const applySelectedCustomer = (cust) => {
  selectedCustomer.value = cust.name
  customerName.value = cust.name
  customer_info.value = { ...cust }
  customerSearchQuery.value = cust.customer_name || cust.name
}

const selectCustomer = (cust) => {
  applySelectedCustomer(cust)
  emit('customer-selected', cust)
  closeCustomerDropdown()
}

const createNewCustomer = () => {
  selectedCustomer.value = ''
  customerName.value = null
  customer_info.value = {}
  showAddCustomerModal.value = true
  closeCustomerDropdown()
}

const moveCustomerHighlight = (delta) => {
  if (!isCustomerDropdownOpen.value) {
    isCustomerDropdownOpen.value = true
    return
  }
  const max = customers.value.length - 1
  let next = customerHighlightedIndex.value + delta
  if (next < -1) next = max
  if (next > max) next = -1
  customerHighlightedIndex.value = next
}

const selectHighlightedCustomer = () => {
  if (customerHighlightedIndex.value === -1) {
    createNewCustomer()
  } else if (customers.value[customerHighlightedIndex.value]) {
    selectCustomer(customers.value[customerHighlightedIndex.value])
  }
}

const handleCustomerUpdated = async (updatedCustomer) => {
  const res = await loadCustomers(customerSearchQuery.value.trim())
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

const clearCustomer = () => {
  selectedCustomer.value = ''
  customerName.value = null
  customer_info.value = {}
  customerSearchQuery.value = ''
  shiftStore.setCustomer(null)
  emit('customer-selected', null)
}

const handleClickOutside = (e) => {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    closeCustomerDropdown()
  }
}

onMounted(async () => {
  document.addEventListener('mousedown', handleClickOutside)

  const list = await loadCustomers()
  const savedCustomer = shiftStore.$state.currentCustomer
  if (savedCustomer?.name && list) {
    const listArr = Array.isArray(list) ? list : customers.value
    const exists = listArr.find(c => c.name === savedCustomer.name)
    if (exists) {
      applySelectedCustomer(exists)
      emit('customer-selected', exists)
    }
  }
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearTimeout(customerDebounceTimer)
})

defineExpose({ clearCustomer })
</script>
