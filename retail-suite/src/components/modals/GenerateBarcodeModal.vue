<!-- GenerateBarcodeModal.vue -->
<template>
  <div
    class="fixed inset-0 flex items-center justify-center z-50 p-4"
    style="background: rgba(0,0,0,0.5);"
    @click.self="$emit('close')"
  >
    <div
      class="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl shadow-2xl"
      style="scrollbar-width: thin;"
      :style="{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }"
    >

      <!-- ══════════ HEADER ══════════ -->
      <div
        class="flex items-center justify-between px-5 py-3 sticky top-0 z-10"
        :style="{ background: 'var(--card-bg)', borderBottom: '1px solid var(--card-border)' }"
      >
        <h3 class="text-sm font-semibold" :style="{ color: 'var(--text-main)' }">Generate Barcode</h3>
        <button
          @click="$emit('close')"
          class="w-6 h-6 flex items-center justify-center rounded transition-colors"
          :style="{ color: 'var(--text-muted)' }"
          @mouseover="$event.currentTarget.style.background = 'var(--nav-item-hover-bg)'"
          @mouseleave="$event.currentTarget.style.background = 'transparent'"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- ══════════ FORM ══════════ -->
      <form @submit.prevent="handleSubmit" class="p-5 space-y-4">

        <!-- Step Indicator -->
        <StepIndicator
          :current-step="currentStep"
          :steps="steps"
          @change-step="changeStep"
        />

        <!-- ─── STEP 1: Select Product ─── -->
        <div v-if="currentStep === 0" class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--text-muted)' }">
            Select Product
          </h4>

          <!-- Product select -->
          <div>
            <label class="block text-xs font-medium mb-1" :style="{ color: 'var(--text-muted)' }">Product *</label>
            <select
              v-model="form.item_code"
              class="w-full px-3 py-1.5 rounded-md text-xs focus:outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--input-border)'
              }"
            >
              <option value="">— Select Product —</option>
              <option v-for="product in products" :key="product.item_code" :value="product.item_code">
                {{ product.item_code }}
              </option>
            </select>
          </div>

          <!-- Search -->
          <div class="relative">
            <Search class="absolute left-2.5 top-2 w-3 h-3 pointer-events-none" :style="{ color: 'var(--text-muted)' }" />
            <input
              v-model="searchProduct"
              type="text"
              placeholder="Search product..."
              class="w-full pl-8 pr-3 py-1.5 rounded-md text-xs focus:outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--input-border)'
              }"
            />
          </div>

          <!-- Selected Product Info -->
          <div
            v-if="selectedProduct"
            class="rounded-md p-3"
            :style="{ background: 'var(--info-bg)', border: '1px solid var(--info-border)' }"
          >
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--text-muted)' }">Product Name</p>
                <p class="text-xs font-medium" :style="{ color: 'var(--text-main)' }">{{ selectedProduct.item_name }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--text-muted)' }">SKU</p>
                <p class="text-xs font-medium font-mono" :style="{ color: 'var(--text-main)' }">{{ selectedProduct.item_code }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--text-muted)' }">Price</p>
                <p class="text-xs font-medium" :style="{ color: 'var(--focus-ring)' }">{{ formatPrice(selectedProduct.price) }}</p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-wide mb-0.5" :style="{ color: 'var(--text-muted)' }">Category</p>
                <p class="text-xs font-medium" :style="{ color: 'var(--text-main)' }">{{ selectedProduct.item_group || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <div
            v-else
            class="rounded-md p-3"
            :style="{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }"
          >
            <p class="text-xs" :style="{ color: 'var(--warning-border)' }">Please select a product to continue</p>
          </div>
        </div>

        <!-- ─── STEP 2: Barcode Settings ─── -->
        <div v-if="currentStep === 1" class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--text-muted)' }">
            Barcode Settings
          </h4>

          <!-- Barcode Type grid -->
          <div>
            <label class="block text-xs font-medium mb-1.5" :style="{ color: 'var(--text-muted)' }">Barcode Type *</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                v-for="type in [...barcodeTypes, 'QR']"
                :key="type"
                type="button"
                @click="form.type = type"
                class="p-2.5 rounded-md text-xs font-medium transition-all"
                :style="form.type === type
                  ? { background: 'var(--info-bg)', color: 'var(--focus-ring)', border: '2px solid var(--focus-ring)' }
                  : { background: 'var(--item-bg)', color: 'var(--text-sub)', border: '2px solid var(--item-border)' }"
              >
                {{ type }}
              </button>
            </div>
          </div>

          <!-- Barcode Value -->
          <div>
            <label class="block text-xs font-medium mb-1" :style="{ color: 'var(--text-muted)' }">Barcode Value</label>
            <div class="flex gap-2">
              <input
                v-model="form.value"
                type="text"
                placeholder="Leave empty for auto-generation"
                class="flex-1 px-3 py-1.5 rounded-md text-xs focus:outline-none"
                :style="{
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--input-border)'
                }"
              />
              <button
                type="button"
                @click="autoGenerateValue"
                class="px-3 py-1.5 text-white rounded-md text-xs font-medium transition-colors"
                :style="{ background: 'var(--focus-ring)' }"
                title="Auto Generate"
              >
                <RefreshCcw class="w-3.5 h-3.5" />
              </button>
            </div>
            <p class="text-xs mt-1" :style="{ color: 'var(--text-muted)' }">Length: {{ form.value?.length || 0 }} characters</p>
          </div>

          <!-- Preview -->
          <div>
            <label class="block text-xs font-medium mb-1" :style="{ color: 'var(--text-muted)' }">Preview</label>
            <div
              class="rounded-md h-36 flex items-center justify-center"
              :style="{ background: 'var(--item-bg)', border: '1px solid var(--card-border)' }"
            >
              <img
                v-if="previewBarcode"
                :src="previewBarcode"
                class="max-w-full max-h-full object-contain"
              />
              <p v-else class="text-xs" :style="{ color: 'var(--text-muted)' }">Barcode preview will appear here</p>
            </div>
          </div>
        </div>

        <!-- ─── STEP 3: Quantity & Options ─── -->
        <div v-if="currentStep === 2" class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--text-muted)' }">
            Quantity & Options
          </h4>

          <!-- Quantity -->
          <div>
            <label class="block text-xs font-medium mb-1" :style="{ color: 'var(--text-muted)' }">Quantity *</label>
            <input
              v-model.number="form.quantity"
              type="number"
              min="1"
              max="1000"
              class="w-full px-3 py-1.5 rounded-md text-xs focus:outline-none"
              :style="{
                background: 'var(--input-bg)',
                color: 'var(--text-main)',
                border: '1px solid var(--input-border)'
              }"
            />
            <p class="text-xs mt-1" :style="{ color: 'var(--text-muted)' }">Up to 1000 barcodes at once</p>
          </div>

          <!-- Prefix + Suffix -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium mb-1" :style="{ color: 'var(--text-muted)' }">Prefix (Optional)</label>
              <input
                v-model="form.prefix"
                type="text"
                placeholder="e.g., PRD"
                maxlength="5"
                class="w-full px-3 py-1.5 rounded-md text-xs focus:outline-none"
                :style="{
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--input-border)'
                }"
              />
            </div>
            <div>
              <label class="block text-xs font-medium mb-1" :style="{ color: 'var(--text-muted)' }">Suffix (Optional)</label>
              <input
                v-model="form.suffix"
                type="text"
                placeholder="e.g., 2025"
                maxlength="5"
                class="w-full px-3 py-1.5 rounded-md text-xs focus:outline-none"
                :style="{
                  background: 'var(--input-bg)',
                  color: 'var(--text-main)',
                  border: '1px solid var(--input-border)'
                }"
              />
            </div>
          </div>

          <!-- Options -->
          <div
            class="rounded-md p-3 space-y-2"
            :style="{ background: 'var(--item-bg)', border: '1px solid var(--item-border)' }"
          >
            <p class="text-xs font-semibold mb-2" :style="{ color: 'var(--text-sub)' }">Options</p>
            <label v-for="(label, key) in {
              printImmediately:      'Print immediately after generation',
              activateAutomatically: 'Activate barcodes automatically',
              downloadAfter:         'Download file after generation'
            }" :key="key" class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form[key]"
                type="checkbox"
                class="w-3.5 h-3.5 rounded"
                :style="{ accentColor: 'var(--focus-ring)' }"
              />
              <span class="text-xs" :style="{ color: 'var(--text-sub)' }">{{ label }}</span>
            </label>
          </div>

          <!-- Summary -->
          <div
            class="rounded-md p-3"
            :style="{ background: 'var(--info-bg)', border: '1px solid var(--info-border)' }"
          >
            <p class="text-xs" :style="{ color: 'var(--focus-ring)' }">
              Ready to generate <strong>{{ form.quantity }}</strong> barcode(s) for
              <strong>{{ selectedProduct?.item_code }}</strong>
            </p>
          </div>
        </div>

        <!-- ─── STEP 4: Confirm ─── -->
        <div v-if="currentStep === 3" class="space-y-3">
          <h4 class="text-xs font-semibold uppercase tracking-wide" :style="{ color: 'var(--text-muted)' }">
            Confirm & Generate
          </h4>

          <!-- Review -->
          <div
            class="rounded-md overflow-hidden"
            :style="{ border: '1px solid var(--card-border)' }"
          >
            <div
              v-for="(item, idx) in [
                { label: 'Product',       value: selectedProduct?.item_name },
                { label: 'SKU',           value: selectedProduct?.item_code },
                { label: 'Barcode Type',  value: form.type                  },
                { label: 'Quantity',      value: form.quantity               },
                { label: 'Auto-Activate', value: form.activateAutomatically ? 'Yes' : 'No' },
              ]"
              :key="idx"
              class="flex justify-between items-center px-3 py-2"
              :style="{
                background: idx % 2 === 0 ? 'var(--item-bg)' : 'var(--card-bg)',
                borderBottom: idx < 4 ? '1px solid var(--card-border)' : 'none'
              }"
            >
              <span class="text-xs" :style="{ color: 'var(--text-muted)' }">{{ item.label }}</span>
              <span class="text-xs font-medium" :style="{ color: 'var(--text-main)' }">{{ item.value }}</span>
            </div>
          </div>

          <!-- Generate Button -->
          <button
            type="button"
            @click="generateBarcodes"
            :disabled="isGenerating"
            class="w-full py-2 text-white rounded-md text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            :style="{ background: 'var(--icon-color-green)' }"
          >
            <svg v-if="isGenerating" class="w-3.5 h-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
            </svg>
            <span>{{ isGenerating ? 'Generating...' : `Generate ${form.quantity} Barcode(s)` }}</span>
          </button>
        </div>

        <!-- Error -->
        <div
          v-if="errorMessage"
          class="rounded-md p-3 text-xs"
          :style="{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca' }"
        >
          {{ errorMessage }}
        </div>

        <!-- Success -->
        <div
          v-if="successMessage"
          class="rounded-md p-3 text-xs"
          :style="{ background: 'var(--icon-bg-green)', color: 'var(--icon-color-green)', border: '1px solid var(--icon-color-green)' }"
        >
          {{ successMessage }}
        </div>

      </form>

      <!-- ══════════ FOOTER ══════════ -->
      <div
        class="flex items-center justify-between px-5 py-3"
        :style="{ borderTop: '1px solid var(--card-border)', background: 'var(--item-bg)' }"
      >
        <button
          type="button"
          @click="previousStep"
          :disabled="currentStep === 0"
          class="px-4 py-1.5 text-xs rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          :style="{
            background: 'var(--card-bg)',
            color: 'var(--text-sub)',
            border: '1px solid var(--card-border)'
          }"
        >
          Previous
        </button>

        <div class="flex gap-2">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-1.5 text-xs rounded-md transition-colors"
            :style="{
              background: 'var(--card-bg)',
              color: 'var(--text-sub)',
              border: '1px solid var(--card-border)'
            }"
            @mouseover="$event.currentTarget.style.background = 'var(--nav-item-hover-bg)'"
            @mouseleave="$event.currentTarget.style.background = 'var(--card-bg)'"
          >
            Cancel
          </button>

          <button
            v-if="currentStep < 3"
            type="button"
            @click="nextStep"
            :disabled="!canProceedToNext"
            class="px-4 py-1.5 text-xs text-white rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :style="{ background: 'var(--focus-ring)' }"
          >
            Next
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import { generateBarcodePreview, generateBarcodeValue } from '../../composables/barcode'
import { X, Search, RefreshCcw } from 'lucide-vue-next'
import StepIndicator from '@/components/modals/StepIndicator.vue'
import { formatPrice } from '@/utils/formatters'

const props = defineProps({
  products:     { type: Array, default: () => [] },
  barcodeTypes: { type: Array, default: () => [] },
  uoms:         { type: Array, default: () => [] },
})

const emit = defineEmits(['generate', 'close', 'refreshBarcodes'])
const toast = useToast()

const currentStep   = ref(0)
const searchProduct = ref('')
const errorMessage  = ref('')
const successMessage = ref('')
const isGenerating  = ref(false)
const previewBarcode = ref('')

const steps = ['Product', 'Settings', 'Quantity', 'Confirm']

const form = reactive({
  item_code:             '',
  type:                  'EAN',
  value:                 '',
  quantity:              1,
  prefix:                '',
  suffix:                '',
  printImmediately:      false,
  activateAutomatically: true,
  downloadAfter:         false,
})

const products = computed(() => props.products)

const selectedProduct = computed(() =>
  props.products.find(p => p.item_code === form.item_code)
)

const canProceedToNext = computed(() => {
  if (currentStep.value === 0) return form.item_code !== ''
  if (currentStep.value === 1) return form.type !== ''
  return true
})

const changeStep = (step) => {
  // only allow going back
  if (step < currentStep.value) {
    currentStep.value = step
    errorMessage.value = ''
  }
}

const autoGenerateValue = async () => {
  if (!form.type) return toast.warning('Please select barcode type first')
  try {
    const valueRes = await generateBarcodeValue(form.type)
    if (valueRes.status !== 'success' || !valueRes.value)
      return toast.error(`Failed to generate value for "${form.type}"`)
    form.value = valueRes.value
    const preview = await generateBarcodePreview({ value: form.value, type: form.type })
    if (preview) previewBarcode.value = preview
    console.log("Preview is:", preview)
    console.log("Generated Value is:", form.value)
  } catch (error) {
    console.error('autoGenerateValue error:', error)
    toast.error('Failed to generate barcode')
  }
}

const nextStep = () => {
  if (currentStep.value === 0 && !form.item_code) {
    errorMessage.value = 'Please select a product to continue.'; return
  }
  if (currentStep.value === 1) {
    if (!form.type)  { errorMessage.value = 'Please select a barcode type.';  return }
    if (!form.value) { errorMessage.value = 'Please enter or generate a barcode value.'; return }
  }
  if (currentStep.value === 2 && (!form.quantity || form.quantity < 1 || form.quantity > 1000)) {
    errorMessage.value = 'Quantity must be between 1 and 1000.'; return
  }
  if (currentStep.value < steps.length - 1) {
    errorMessage.value = ''
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 0) { errorMessage.value = ''; currentStep.value-- }
}

const generateBarcodes = async () => {
  errorMessage.value = ''; successMessage.value = ''; isGenerating.value = true
  try {
    if (!form.item_code) throw new Error('Please select a product')
    if (!form.type)      throw new Error('Please select barcode type')
    if (form.quantity < 1 || form.quantity > 1000) throw new Error('Quantity must be between 1 and 1000')

    await new Promise(resolve => setTimeout(resolve, 1500))
    successMessage.value = `Successfully generated ${form.quantity} barcode(s)!`

    emit('generate', { ...form, productName: selectedProduct.value?.item_name })
    emit('refreshBarcodes')
    setTimeout(() => emit('close'), 1000)
  } catch (error) {
    errorMessage.value = error.message || 'Error generating barcodes'
  } finally {
    isGenerating.value = false
  }
}

const handleSubmit = () => {}
</script>
