<!-- PatientSection.vue -->
<template>
  <div
    class="relative flex items-stretch gap-4 rounded-3xl"
    ref="rootEl"
  >
    <!-- ============ PATIENT SEARCH ============ -->
    <div class="relative flex-1">
      <input
        type="text"
        v-model="patientSearchQuery"
        @focus="openPatientDropdown"
        @input="onPatientSearchInput"
        @keydown.down.prevent="movePatientHighlight(1)"
        @keydown.up.prevent="movePatientHighlight(-1)"
        @keydown.enter.prevent="selectHighlightedPatient"
        @keydown.esc="closePatientDropdown"
        :placeholder="__('Patient (Optional)...')"
        class="w-full h-full p-4 outline-none rounded-3xl text-sm transition-all"
        :style="{ background: 'var(--input-bg)', color: 'var(--text-main)', border: 'none' }"
      />

      <div
        v-show="isPatientDropdownOpen"
        class="absolute z-20 left-0 right-0 mt-1 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        :style="{ background: 'var(--input-bg)', border: '1px solid var(--input-border)' }"
      >
        <div
          v-if="allowCreate"
          class="px-3 py-2 cursor-pointer font-semibold flex items-center gap-2"
          :class="{ 'ring-2': patientHighlightedIndex === -1 }"
          :style="{ color: primaryColor }"
          @mousedown.prevent="createNewPatient"
        >
          <span>+</span>
          <span>{{ __('Create a new Patient') }}</span>
        </div>

        <div v-if="isSearchingPatients" class="px-3 py-2 text-sm opacity-70">
          {{ __('Searching...') }}
        </div>
        <div v-else-if="!patients.length" class="px-3 py-2 text-sm opacity-70">
          {{ __('No patients found') }}
        </div>
        <div
          v-for="(patient, idx) in patients"
          :key="patient.name"
          class="px-3 py-2 cursor-pointer transition-all"
          :class="{ 'bg-black/5': patientHighlightedIndex === idx }"
          @mousedown.prevent="selectPatient(patient)"
        >
          <div class="font-medium">{{ patient.patient_name || patient.name }}</div>
          <div class="text-xs opacity-60">
            {{ [patient.patient_name, patient.mobile, patient.name].filter(Boolean).join(', ') }}
          </div>
        </div>

        <div
          class="px-3 py-2 cursor-pointer flex items-center gap-2 border-t text-sm opacity-70 hover:opacity-100"
          :style="{ borderColor: 'var(--input-border)' }"
          @mousedown.prevent="openAdvancedSearch"
        >
          <span>🔍</span>
          <span>{{ __('Advanced Search') }}</span>
        </div>
      </div>
    </div>

    <!-- ============ LOAD PRESCRIPTIONS ============ -->
    <button
      type="button"
      class="flex-shrink-0 px-4 py-2 rounded-3xl text-sm font-semibold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      :style="{ background: primaryColor, color: '#fff' }"
      :disabled="!selectedPatient || isLoadingPrescriptions"
      @click="loadPrescriptions"
    >
      <span>💊</span>
      <span v-if="isLoadingPrescriptions">{{ __('Loading...') }}</span>
      <span v-else>{{ __('Load Prescriptions') }}</span>
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useShiftStore } from '@/stores/shift.js'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
  // Show the "+ Create a new Patient" row, matching native Frappe Link
  // field behavior. Emits `create-new-patient` - parent should open
  // whatever patient-creation modal/route you use (e.g. /app/patient/new).
  allowCreate: { type: Boolean, default: true }
})

// emits:
//  - patient-selected(patient | null)
//  - create-new-patient()
//  - prescriptions-loaded({ patient, medicationRequests })   -> parent matches
//    each request against its product/medication list and adds to cart,
//    mirroring add_medication_to_cart() in pharmacy_pos.js
const emit = defineEmits(['patient-selected', 'create-new-patient', 'prescriptions-loaded'])

const settingsStore = useSettingsStore()
const settings = computed(() => settingsStore.settings)
const primaryColor = computed(() => settings.value?.appearance?.primaryColor || '#06b6d4')

const shiftStore = useShiftStore()

const rootEl = ref(null)

// ---------------------------------------------------------------------
// PATIENT SEARCH
// ---------------------------------------------------------------------
const selectedPatient = ref('')
const patients = ref([])
const patientInfo = ref({})

const patientSearchQuery = ref('')
const isPatientDropdownOpen = ref(false)
const isSearchingPatients = ref(false)
const patientHighlightedIndex = ref(-1)
let patientDebounceTimer = null
let patientSearchToken = 0

const loadPatients = async (term = '') => {
  const token = ++patientSearchToken
  try {
    isSearchingPatients.value = true
    const list = await shiftStore.getPatients(term)
    if (token !== patientSearchToken) return list
    patients.value = list || []
    return list || 'skipped'
  } catch (e) {
    console.error('Failed to load patients:', e)
  } finally {
    if (token === patientSearchToken) isSearchingPatients.value = false
  }
}

const onPatientSearchInput = () => {
  isPatientDropdownOpen.value = true
  patientHighlightedIndex.value = -1
  clearTimeout(patientDebounceTimer)
  patientDebounceTimer = setTimeout(() => {
    loadPatients(patientSearchQuery.value.trim())
  }, 300)
}

const openPatientDropdown = () => {
  isPatientDropdownOpen.value = true
  if (!patients.value.length) loadPatients(patientSearchQuery.value.trim())
}

const closePatientDropdown = () => {
  isPatientDropdownOpen.value = false
  patientHighlightedIndex.value = -1
}

const applySelectedPatient = (patient) => {
  selectedPatient.value = patient?.name || ''
  patientInfo.value = patient ? { ...patient } : {}
  patientSearchQuery.value = patient ? (patient.patient_name || patient.name) : ''
}

const selectPatient = (patient) => {
  applySelectedPatient(patient)
  emit('patient-selected', patient)
  closePatientDropdown()
}

const createNewPatient = () => {
  applySelectedPatient(null)
  emit('create-new-patient')
  closePatientDropdown()
}

const openAdvancedSearch = () => {
  // Same destination the native Frappe Link field's "Advanced Search"
  // option goes to - the standard Patient list view.
  window.open('/app/patient', '_blank')
  closePatientDropdown()
}

const clearPatient = () => {
  applySelectedPatient(null)
  emit('patient-selected', null)
}

const movePatientHighlight = (delta) => {
  if (!isPatientDropdownOpen.value) {
    isPatientDropdownOpen.value = true
    return
  }
  const max = patients.value.length - 1
  let next = patientHighlightedIndex.value + delta
  const floor = props.allowCreate ? -1 : 0
  if (next < floor) next = max
  if (next > max) next = floor
  patientHighlightedIndex.value = next
}

const selectHighlightedPatient = () => {
  if (patientHighlightedIndex.value === -1 && props.allowCreate) {
    createNewPatient()
  } else if (patients.value[patientHighlightedIndex.value]) {
    selectPatient(patients.value[patientHighlightedIndex.value])
  }
}

// ---------------------------------------------------------------------
// LOAD PRESCRIPTIONS — mirrors load_patient_medications() in
// pharmacy_pos.js. This component doesn't own the product list or cart,
// so it fetches the pending requests and hands them off; the parent does
// the matching + adding, same as add_medication_to_cart()/
// add_item_to_cart() do in pharmacy_pos.js.
// ---------------------------------------------------------------------
const isLoadingPrescriptions = ref(false)

const loadPrescriptions = async () => {
  if (!selectedPatient.value) return

  isLoadingPrescriptions.value = true
  try {
    // Mirrors the Medication Request query in load_patient_medications()
    // (pharmacy_pos.js line ~2090): active, unbilled/partly-billed requests
    // for this patient. Needs a matching whitelisted method added to
    // retail/retail/api/patient.py (see companion notes).
    const medicationRequests = await shiftStore.getPatientPrescriptions(selectedPatient.value)

    emit('prescriptions-loaded', {
      patient: selectedPatient.value,
      medicationRequests: medicationRequests || []
    })
  } catch (e) {
    console.error('Failed to load prescriptions:', e)
  } finally {
    isLoadingPrescriptions.value = false
  }
}

// ---------------------------------------------------------------------
// Click-outside handling (scoped to this component's own root)
// ---------------------------------------------------------------------
const handleClickOutside = (e) => {
  if (rootEl.value && !rootEl.value.contains(e.target)) {
    closePatientDropdown()
  }
}

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside)
  clearTimeout(patientDebounceTimer)
})

defineExpose({ clearPatient })
</script>
