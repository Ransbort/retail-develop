<!-- EditBarcodeModal.vue -->
<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">

      <!-- Header -->
      <div class="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
        <h3 class="text-base sm:text-lg font-semibold text-gray-900">Edit Barcode</h3>
        <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700 text-2xl font-light">✕</button>
      </div>

      <!-- Content -->
      <form @submit.prevent="handleSubmit" class="p-4 space-y-4">

        <!-- Read-only reference info -->
        <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500 font-medium">SKU (Item)</span>
            <span class="text-sm font-mono text-gray-800">{{ barcode.sku }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500 font-medium">Product</span>
            <span class="text-sm text-gray-800">{{ barcode.productName }}</span>
          </div>
          <div class="flex justify-between items-center">
            <span class="text-xs text-gray-500 font-medium">Current Barcode</span>
            <span class="text-sm font-mono text-gray-800">{{ barcode.code }}</span>
          </div>
        </div>

        <!-- ① Barcode Value -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Barcode Value <span class="text-red-500">*</span>
          </label>
          <div class="flex gap-2">
            <input
              v-model="editForm.barcode"
              type="text"
              :class="[
                'flex-1 px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                fieldError.barcode ? 'border-red-400 bg-red-50' : 'border-gray-300'
              ]"
              @input="fieldError.barcode = ''"
            />
            <!--
              🔄 Auto-generate: emits to parent which calls the API
              (generateBarcodeValue + generateBarcodePreview)
              then parent updates editForm.barcode + preview via prop/watch
            -->
            <button
              type="button"
              :disabled="!editForm.barcode_type || isGenerating"
              @click="$emit('autoGenerate', { type: editForm.barcode_type })"
              class="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition text-sm"
              :title="editForm.barcode_type ? 'Auto Generate' : 'Select a type first'"
            >
              <span v-if="isGenerating" class="animate-spin inline-block">⏳</span>
              <span v-else>🔄</span>
            </button>
          </div>
          <p v-if="fieldError.barcode" class="text-xs text-red-600 mt-1">{{ fieldError.barcode }}</p>
          <p v-else class="text-xs text-gray-400 mt-1">{{ editForm.barcode.length }} chars</p>
        </div>

        <!-- ② Barcode Type -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">
            Barcode Type <span class="text-red-500">*</span>
          </label>
          <select
            v-model="editForm.barcode_type"
            :class="[
              'w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              fieldError.barcode_type ? 'border-red-400 bg-red-50' : 'border-gray-300'
            ]"
            @change="fieldError.barcode_type = ''"
          >
            <option value="">Select Type</option>
            <option v-for="type in barcodeTypes" :key="type" :value="type">{{ type }}</option>
          </select>
          <p v-if="fieldError.barcode_type" class="text-xs text-red-600 mt-1">{{ fieldError.barcode_type }}</p>
        </div>

        <!-- ③ UOM -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-1">Unit of Measure</label>
          <select
            v-model="editForm.uom"
            class="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select UOM</option>
            <option v-for="uom in uoms" :key="uom.name" :value="uom.name">{{ uom.name }}</option>
          </select>
        </div>

        <!-- Preview — updated by parent after autoGenerate -->
        <div class="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <p class="text-xs text-gray-500 font-medium mb-2">Preview</p>
          <div class="bg-white p-2 rounded border border-gray-200 h-20 flex items-center justify-center">
            <img
              v-if="currentPreview"
              :src="currentPreview"
              :alt="editForm.barcode"
              class="max-h-full max-w-full object-contain"
            />
            <p v-else class="text-gray-400 text-xs">No preview available</p>
          </div>
          <p class="text-xs text-gray-400 mt-1">
            {{ currentPreview === barcode.preview ? 'Original preview' : 'Updated preview' }}
          </p>
        </div>

        <!-- Server-side error from parent -->
        <div v-if="externalError" class="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-red-800 text-xs">⚠ {{ externalError }}</p>
        </div>

      </form>

      <!-- Footer -->
      <div class="flex gap-2 p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
        <button
          type="button"
          @click="resetForm"
          :disabled="isSubmitting || isGenerating"
          class="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
        >
          Reset
        </button>
        <button
          type="button"
          @click="$emit('close')"
          :disabled="isSubmitting || isGenerating"
          class="flex-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting || isGenerating"
          class="flex-1 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 flex items-center justify-center gap-1"
        >
          <span v-if="isSubmitting" class="animate-spin">⏳</span>
          <span>{{ isSubmitting ? 'Saving…' : 'Save' }}</span>
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { reactive, computed } from 'vue'

const props = defineProps({
  barcode: {
    type: Object,
    required: true
  },
  barcodeTypes: {
    type: Array,
    default: () => []
  },
  uoms: {
    type: Array,
    default: () => []
  },
  // Parent sets true while the save API call is in flight
  isSubmitting: {
    type: Boolean,
    default: false
  },
  // Parent sets true while the auto-generate API call is in flight
  isGenerating: {
    type: Boolean,
    default: false
  },
  // Server-side error from parent (e.g. "Barcode must be unique")
  externalError: {
    type: String,
    default: ''
  },
  // Parent pushes the newly generated barcode value here after autoGenerate succeeds
  generatedValue: {
    type: String,
    default: ''
  },
  // Parent pushes the newly generated preview image here after autoGenerate succeeds
  generatedPreview: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update',
  'close',
  // Child asks parent to run: generateBarcodeValue(type) + generateBarcodePreview(...)
  // Parent will update generatedValue + generatedPreview props when done
  'autoGenerate'
])

// ── Form state: ONLY the 3 Item Barcode child-table fields ───
const editForm = reactive({
  barcode:      props.barcode.code || '',
  barcode_type: props.barcode.type || '',
  uom:          props.barcode.uom  || ''
})

const fieldError = reactive({
  barcode:      '',
  barcode_type: ''
})

// ── Preview: show generated preview if available, else original
const currentPreview = computed(() =>
  props.generatedPreview || props.barcode.preview || ''
)

// ── Watch: when parent pushes a new generatedValue, apply it to the form ──
// We use a watchEffect-free approach: parent already synced via prop, but
// we need to update editForm.barcode when generatedValue changes.
// Use a simple watcher via defineProps + watch.
import { watch } from 'vue'
watch(() => props.generatedValue, (val) => {
  if (val) {
    editForm.barcode  = val
    fieldError.barcode = ''
  }
})

// ── Helpers ──────────────────────────────────────────────────
const resetForm = () => {
  editForm.barcode      = props.barcode.code || ''
  editForm.barcode_type = props.barcode.type || ''
  editForm.uom          = props.barcode.uom  || ''
  fieldError.barcode      = ''
  fieldError.barcode_type = ''
}

// ── Submit ───────────────────────────────────────────────────
const handleSubmit = () => {
  fieldError.barcode      = ''
  fieldError.barcode_type = ''

  let valid = true
  if (!editForm.barcode.trim())  { fieldError.barcode      = 'Barcode value is required'; valid = false }
  if (!editForm.barcode_type)    { fieldError.barcode_type = 'Barcode type is required';  valid = false }
  if (!valid) return

  emit('update', {
    id:           props.barcode.id,
    sku:          props.barcode.sku,
    old_barcode:  props.barcode.code,
    barcode:      editForm.barcode.trim(),
    barcode_type: editForm.barcode_type,
    uom:          editForm.uom
  })
}
</script>
