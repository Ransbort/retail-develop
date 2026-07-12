<template>
  <!-- ════════════════ OVERLAY ════════════════ -->
  <Teleport to="body">
    <Transition name="bu-overlay">
      <div
        v-if="show"
        class="bu-overlay"
        @click.self="close"
        aria-modal="true"
        role="dialog"
        :aria-label="__('Barcode Manager')"
      >
        <!-- ════════════════ DIALOG ════════════════ -->
        <Transition name="bu-dialog">
          <div v-if="show" class="bu-dialog">

            <!-- ── TOP BAR ── -->
            <div class="bu-topbar">
              <div class="bu-topbar-brand">
                <span class="bu-topbar-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M1 5h4M11 5h2M15 5h6M1 19h4M11 19h2M15 19h6"/>
                  </svg>
                </span>
                <span class="bu-topbar-title">{{ __('Barcode Manager') }}</span>
                <span class="bu-topbar-badge">{{ __('POS') }}</span>
              </div>
              <button class="bu-close-btn" @click="close" :aria-label="__('Close')">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- ── BODY ── -->
            <div class="bu-body">

              <!-- LEFT NAV -->
              <nav class="bu-nav">
                <button
                  v-for="mode in modes"
                  :key="mode.key"
                  class="bu-nav-item"
                  :class="{ 'bu-nav-item--active': activeMode === mode.key }"
                  @click="switchMode(mode.key)"
                >
                  <span class="bu-nav-icon" v-html="mode.icon" />
                  <span class="bu-nav-label">{{ mode.label }}</span>
                  <span v-if="mode.badge" class="bu-nav-badge">{{ mode.badge }}</span>
                  <span class="bu-nav-arrow">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="m9 18 6-6-6-6"/>
                    </svg>
                  </span>
                </button>

                <!-- Quick stats in nav -->
                <div class="bu-nav-stats">
                  <div class="bu-nav-stat">
                    <span class="bu-nav-stat-value">{{ products.length }}</span>
                    <span class="bu-nav-stat-label">Items</span>
                  </div>
                  <div class="bu-nav-stat-divider" />
                  <div class="bu-nav-stat">
                    <span class="bu-nav-stat-value">{{ totalBarcodeCount }}</span>
                    <span class="bu-nav-stat-label">{{ __('Barcodes') }}</span>
                  </div>
                </div>
              </nav>

              <!-- RIGHT WORKSPACE -->
              <div class="bu-workspace">
                <Transition name="bu-panel" mode="out-in">

                  <!-- ─────── A: GENERATE ─────── -->
                  <div v-if="activeMode === 'generate'" key="generate" class="bu-panel">
                    <div class="bu-panel-header">
                      <span class="bu-panel-title">{{ __('Barcode Generation') }}</span>
                      <span class="bu-panel-sub">{{ __('Create and save barcodes for your products') }}</span>
                    </div>

                    <div class="bu-gen-grid">
                      <!-- Form -->
                      <div class="bu-form-col">
                        <div class="bu-field">
                          <label class="bu-label">{{ __('Product') }} <span class="bu-required">*</span></label>
                          <div class="bu-select-wrap">
                            <select v-model="gen.item_code" class="bu-select">
                              <option value="">— {{ __('Select a product') }} —</option>
                              <option
                                v-for="p in products"
                                :key="p.item_code"
                                :value="p.item_code"
                              >{{ p.item_name }} ({{ p.item_code }})</option>
                            </select>
                            <span class="bu-select-arrow">▾</span>
                          </div>
                        </div>

                        <div class="bu-field">
                          <label class="bu-label">{{ __('Barcode Type') }} <span class="bu-required">*</span></label>
                          <div class="bu-select-wrap">
                            <select v-model="gen.type" class="bu-select">
                              <option value="">— {{ __('Select type') }} —</option>
                              <option v-for="t in barcodeTypes" :key="t" :value="t">{{ t }}</option>
                            </select>
                            <span class="bu-select-arrow">▾</span>
                          </div>
                        </div>

                        <div class="bu-field">
                          <label class="bu-label">{{ __('Barcode Value') }}</label>
                          <div class="bu-input-group">
                            <input
                              v-model="gen.value"
                              type="text"
                              class="bu-input"
                              :placeholder="__('Leave empty to auto-generate')"
                            />
                            <button
                                  class="bu-input-action"
                                  @click="genAutoValue" :disabled="!gen.type" title="Auto-generate">
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                            </button>
                          </div>
                        </div>

                        <div class="bu-field">
                          <label class="bu-label">{{ __('Unit of Measure') }}</label>
                          <div class="bu-select-wrap">
                            <select v-model="gen.uom" class="bu-select">
                              <option value="">— {{ __('optional') }} —</option>
                              <option v-for="u in uoms" :key="u.name" :value="u.name">{{ u.name }}</option>
                            </select>
                            <span class="bu-select-arrow">▾</span>
                          </div>
                        </div>

                        <button
                          class="bu-btn bu-btn--primary bu-btn--full"
                          :disabled="!gen.item_code || !gen.type || !gen.value || gen.loading"
                          @click="runGenerate"
                        >
                          <span v-if="gen.loading" class="bu-spinner" />
                          <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                          {{ gen.loading ? __('Saving…') : __('Generate & Save') }}
                        </button>

                        <div v-if="gen.error" class="bu-alert bu-alert--error">{{ gen.error }}</div>
                        <div v-if="gen.success" class="bu-alert bu-alert--success">{{ gen.success }}</div>
                      </div>

                      <!-- Preview -->
                      <div class="bu-preview-col">
                        <label class="bu-label">{{ __('Preview') }}</label>
                        <div class="bu-preview-box">
                          <div v-if="gen.preview" class="bu-preview-content">
                            <img :src="gen.preview" class="bu-preview-img" alt="barcode preview" />
                            <div class="bu-preview-code">{{ gen.value }}</div>
                            <div class="bu-preview-type">{{ gen.type }}</div>
                          </div>
                          <div v-else class="bu-preview-empty">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.25"><path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14"/></svg>
                            <span>{{ __('Select product & type, then auto-generate value') }}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ─────── B: SCAN ─────── -->
                  <div v-else-if="activeMode === 'scan'" key="scan" class="bu-panel">
                    <div class="bu-panel-header">
                      <span class="bu-panel-title">{{ __('Scan Barcode') }}</span>
                      <span class="bu-panel-sub">{{ __('Scan or enter a barcode to look up a product') }}</span>
                    </div>

                    <div class="bu-scan-wrap">
                      <!-- Scanner input -->
                      <div class="bu-scan-input-wrap">
                        <div class="bu-scan-icon-wrap">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14M1 5h4M11 5h2M15 5h6M1 19h4M11 19h2M15 19h6"/></svg>
                        </div>
                        <input
                          ref="scanInput"
                          v-model="scan.code"
                          type="text"
                          class="bu-scan-input"
                          :placeholder="__('Scan barcode or enter manually…')"
                          autocomplete="off"
                          @keydown.enter="runScan"
                        />
                        <button class="bu-btn bu-btn--primary" @click="runScan" :disabled="!scan.code.trim()">
                          {{ __('Search') }}
                        </button>
                      </div>

                      <div class="bu-scan-hint">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
                        {{ __('Focus the field and use a USB / Bluetooth barcode scanner, or type manually and press Enter.') }}
                      </div>

                      <!-- Result -->
                      <Transition name="bu-fade">
                        <div v-if="scan.result" class="bu-scan-result" :class="scan.result.found ? 'bu-scan-result--found' : 'bu-scan-result--notfound'">
                          <template v-if="scan.result.found">
                            <div class="bu-scan-result-header">
                              <span class="bu-scan-result-icon bu-scan-result-icon--ok">✓</span>
                              {{ __('Product Found') }}
                            </div>
                            <div class="bu-scan-result-body">
                              <div class="bu-scan-item-img">
                                <img
                                  v-if="scan.result.item.image"
                                  :src="scan.result.item.image"
                                  @error="e => e.target.style.display='none'"
                                />
                                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="opacity:0.3"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                              </div>
                              <div class="bu-scan-item-info">
                                <div class="bu-scan-item-name">{{ scan.result.item.item_name }}</div>
                                <div class="bu-scan-item-meta">
                                  <span class="bu-tag">{{ scan.result.item.item_code }}</span>
                                  <span v-if="scan.result.item.item_group" class="bu-tag bu-tag--muted">{{ scan.result.item.item_group }}</span>
                                </div>
                                <div v-if="scan.result.barcode" class="bu-scan-bc-info">
                                  <span class="bu-mono">{{ scan.result.barcode.barcode }}</span>
                                  <span v-if="scan.result.barcode.barcode_type" class="bu-tag bu-tag--accent">{{ scan.result.barcode.barcode_type }}</span>
                                </div>
                              </div>
                            </div>
                            <div class="bu-scan-actions">
                              <button class="bu-btn bu-btn--sm bu-btn--primary" @click="emitScanResult">
                                {{ __('Add to Cart') }}
                              </button>
                              <button class="bu-btn bu-btn--sm bu-btn--ghost" @click="resetScan">
                                {{ __('Clear') }}
                              </button>
                            </div>
                          </template>
                          <template v-else>
                            <div class="bu-scan-result-header">
                              <span class="bu-scan-result-icon bu-scan-result-icon--err">✕</span>
                              No product found for <span class="bu-mono">"{{ scan.code }}"</span>
                            </div>
                            <div class="bu-scan-nf-actions">
                              <button class="bu-btn bu-btn--sm bu-btn--ghost" @click="goAssignFromScan">
                                {{ __('Assign this barcode to an item →') }}
                              </button>
                            </div>
                          </template>
                        </div>
                      </Transition>

                      <!-- Recent scans -->
                      <div v-if="scan.history.length" class="bu-scan-history">
                        <div class="bu-scan-history-title">{{ __('Recent scans') }}</div>
                        <div class="bu-scan-history-list">
                          <button
                            v-for="(h, i) in scan.history"
                            :key="i"
                            class="bu-scan-history-item"
                            :class="h.found ? 'bu-scan-history-item--ok' : 'bu-scan-history-item--err'"
                            @click="scan.code = h.code; runScan()"
                          >
                            <span class="bu-mono">{{ h.code }}</span>
                            <span>{{ h.found ? h.name : 'Not found' }}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- ─────── C: Product List ─────── -->
                  <div v-else-if="activeMode === 'product-list'" :key="'product-list'" class="bu-panel">
                     <ProductList
                        :products="products"
                        :barcodeTypes="barcodeTypes"
                        :uoms="uoms"
                        @edit-item="openEditItemModal"
                        @delete-item="deleteItem"
                        @add-barcode="openAddBarcodeForItem"
                        @view-barcode="viewBarcode"
                        @download-barcode="downloadBarcode"
                        @edit-barcode="editBarcodeRow"
                        @delete-barcode="deleteBarcodeRow"
                      />
                  </div>
                  <!-- ─────── D: ASSIGN ─────── -->
                  <div v-else-if="activeMode === 'assign'" key="assign" class="bu-panel">
                    <div class="bu-panel-header">
                      <span class="bu-panel-title">{{ __('Assign Barcode') }}</span>
                      <span class="bu-panel-sub">{{ __('Link a new or existing barcode to a product') }}</span>
                    </div>

                    <div class="bu-assign-grid">
                      <!-- Step 1 -->
                      <div class="bu-step">
                        <div class="bu-step-num">1</div>
                        <div class="bu-step-body">
                          <div class="bu-step-title">{{ __('Select Product') }}</div>
                          <div class="bu-assign-item-search">
                            <div class="bu-search-wrap bu-search-wrap--full">
                              <svg class="bu-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                              <input
                                v-model="assign.itemSearch"
                                type="text"
                                class="bu-search-input"
                                :placeholder="__('Search product…')"
                              />
                            </div>
                            <div class="bu-assign-item-list">
                              <button
                                v-for="item in assignFilteredItems"
                                :key="item.item_code"
                                class="bu-assign-item-btn"
                                :class="{ 'bu-assign-item-btn--active': assign.selectedItem?.item_code === item.item_code }"
                                @click="assign.selectedItem = item"
                              >
                                <div class="bu-assign-item-info">
                                  <span class="bu-assign-item-name">{{ item.item_name }}</span>
                                  <span class="bu-code-pill bu-code-pill--xs">{{ item.item_code }}</span>
                                </div>
                                <span class="bu-assign-item-bc">{{ item.item_barcode?.length || 0 }} {{ __('bacodes') }}</span>
                              </button>
                            </div>
                          </div>

                          <div v-if="assign.selectedItem" class="bu-assign-selected">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                            <strong>{{ assign.selectedItem.item_name }}</strong>
                            <span class="bu-code-pill bu-code-pill--xs">{{ assign.selectedItem.item_code }}</span>
                          </div>
                        </div>
                      </div>

                      <!-- Step 2 -->
                      <div class="bu-step" :class="{ 'bu-step--disabled': !assign.selectedItem }">
                        <div class="bu-step-num">2</div>
                        <div class="bu-step-body">
                          <div class="bu-step-title">{{ __('Barcode Details') }}</div>
                          <div class="bu-field">
                            <label class="bu-label">{{ __('Type') }} <span class="bu-required">*</span></label>
                            <div class="bu-select-wrap">
                              <select v-model="assign.type" class="bu-select" :disabled="!assign.selectedItem">
                                <option value="">— {{ __('Select type') }} —</option>
                                <option v-for="t in barcodeTypes" :key="t" :value="t">{{ t }}</option>
                              </select>
                              <span class="bu-select-arrow">▾</span>
                            </div>
                          </div>
                          <div class="bu-field">
                            <label class="bu-label">{{ __('Barcode Value') }} <span class="bu-required">*</span></label>
                            <div class="bu-input-group">
                              <input
                                v-model="assign.barcode"
                                type="text"
                                class="bu-input"
                                :disabled="!assign.selectedItem"
                                :placeholder="__('Enter or auto-generate')"
                              />
                              <button
                                class="bu-input-action"
                                :disabled="!assign.type"
                                @click="assignAutoValue"
                                :title="__('Auto-generate')"
                              >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
                              </button>
                            </div>
                          </div>
                          <div class="bu-field">
                            <label class="bu-label">
                              {{ __('UOM') }}
                              <span>({{ __('optional') }})</span>
                            </label>
                            <div class="bu-select-wrap">
                              <select v-model="assign.uom" class="bu-select" :disabled="!assign.selectedItem">
                                <option value="">— {{ __('None') }} —</option>
                                <option v-for="u in uoms" :key="u.name" :value="u.name">{{ u.name }}</option>
                              </select>
                              <span class="bu-select-arrow">▾</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <!-- Step 3 / Submit -->
                      <div class="bu-step" :class="{ 'bu-step--disabled': !assign.selectedItem || !assign.barcode || !assign.type }">
                        <div class="bu-step-num">3</div>
                        <div class="bu-step-body">
                          <div class="bu-step-title">{{ __('Confirm & Save') }}</div>
                          <div v-if="assign.selectedItem && assign.barcode && assign.type" class="bu-assign-summary">
                            <div class="bu-assign-summary-row">
                              <span>Item</span>
                              <strong>{{ assign.selectedItem.item_name }}</strong>
                            </div>
                            <div class="bu-assign-summary-row">
                              <span>{{ __('Barcode') }}</span>
                              <strong class="bu-mono">{{ assign.barcode }}</strong>
                            </div>
                            <div class="bu-assign-summary-row">
                              <span>{{ __('Type') }}</span>
                              <strong>{{ assign.type }}</strong>
                            </div>
                            <div v-if="assign.uom" class="bu-assign-summary-row">
                              <span>{{ __('UOM') }}</span>
                              <strong>{{ assign.uom }}</strong>
                            </div>
                          </div>
                          <div v-else class="bu-assign-summary-placeholder">
                            {{ __('Complete steps 1 & 2 to continue') }}
                          </div>
                          <button
                            class="bu-btn bu-btn--primary bu-btn--full"
                            :disabled="!assign.selectedItem || !assign.barcode || !assign.type || assign.loading"
                            @click="runAssign"
                          >
                            <span v-if="assign.loading" class="bu-spinner" />
                            <svg v-else width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M20 6 9 17l-5-5"/></svg>
                           {{ assign.loading ? __('Saving…') : __('Assign Barcode') }}
                          </button>
                          <div v-if="assign.error" class="bu-alert bu-alert--error">{{ assign.error }}</div>
                          <div v-if="assign.success" class="bu-alert bu-alert--success">{{ assign.success }}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                </Transition>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick, onMounted, toValue } from 'vue'
import ProductList from './Sections/ProductList.vue'
import {getBarcodeTypes, addItemBarcode, generateBarcodeValue, generateBarcodePreview} from '@/composables/barcode'
import { useInventoryStore } from '@/stores/inventory'
import { useProductsStore } from '@/stores/products'
import { useShiftStore } from '@/stores/shift'

const shiftStore = useShiftStore()
const inventoryStore = useInventoryStore()
const productsStore = useProductsStore()

const barcodeTypes = ref([])
const uoms = ref([])


const products = computed(() => productsStore.products)
// ─────────────────────────────────────────────────────────
// PROPS & EMITS
// ─────────────────────────────────────────────────────────
const props = defineProps({
  show:         { type: Boolean, default: true },
})

const emit = defineEmits(['close', 'scan', 'assign', 'generate', 'refresh', 'add-to-cart'])

// ─────────────────────────────────────────────────────────
// NAVIGATION MODES
// ─────────────────────────────────────────────────────────
const ICON_GENERATE = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5v14M7 5v14M13 5v14M17 5v14M21 5v14"/></svg>`
const ICON_SCAN     = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>`
const ICON_LIST     = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></svg>`
const ICON_ASSIGN   = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`

const modes = computed(() => [
  { key: 'generate', label: __('Generate Barcode'), icon: ICON_GENERATE },
  { key: 'scan', label: __('Scan Barcode'), icon: ICON_SCAN },
  { key: 'product-list', label: __('Product List'), icon: ICON_LIST, badge: products.length || null },
  { key: 'assign', label: __('Assign Barcode'), icon: ICON_ASSIGN },
])
const activeMode = ref('generate')
const scanInput  = ref(null)

const switchMode = (key) => {
  console.log('switchMode called:', key)
  activeMode.value = key
  if (key === 'assign') {
    console.log('products sample:', JSON.parse(JSON.stringify(products.value.slice(0, 3))))
  }
  if (key === 'scan') nextTick(() => scanInput.value?.focus())
}
const close = () => emit('close')

// ─────────────────────────────────────────────────────────
// STATS
// ─────────────────────────────────────────────────────────
const totalBarcodeCount = computed(() =>
  products.value.reduce((acc, p) => acc + (p.item_barcode?.length || 0), 0)
)

// ─────────────────────────────────────────────────────────
// A: GENERATE STATE
// ─────────────────────────────────────────────────────────
const gen = reactive({
  item_code: '', type: '', value: '', uom: '',
  preview: '', loading: false, error: '', success: '',
})

const genAutoValue = async () => {
  if (!gen.type) return
  gen.error = ''; gen.success = ''
  try {
    const valueRes = await generateBarcodeValue(gen.type)
    if (valueRes.status !== 'success' || !valueRes.value)
      return toast.error(`Failed to generate value for "${gen.type}"`)
    gen.value = valueRes.value
    const preview = await generateBarcodePreview({ value: gen.value, type: gen.type })
    if (preview) gen.preview = preview

  } catch (e) {
    gen.error = 'Failed to auto-generate value'
  }
}


const runGenerate = async () => {
  if (!gen.item_code || !gen.type || !gen.value) return
  gen.loading = true; gen.error = ''; gen.success = ''
  try {
    console.log('gen', gen)
    const res = await addItemBarcode(gen)
    console.log('res', res)

    if (res.status === 'success') {
      gen.success = `✅ Barcode ${gen.value} added successfully`
      emit('refresh')
    } else {
      gen.error = `❌ Failed to add barcode ${gen.value}`
    }
  } catch (e) {
    gen.error = e?.message || 'Failed to generate barcode'
  } finally {
    gen.loading = false
  }
}

// ─────────────────────────────────────────────────────────
// B: SCAN STATE
// ─────────────────────────────────────────────────────────
const scan = reactive({ code: '', result: null, history: [] })

const runScan = async () => {
  const code = scan.code.trim()
  if (!code) return

  try {
    const response = await productsStore.searchProducts(code)

    const items = response?.items ?? (Array.isArray(response) ? response : [])
    const searchContext = response?.search_context || {}
    console.log("items", items)
    console.log("searchContext", searchContext)
    if (items.length > 0) {
      scan.result = {
        found: true,
        item: items[0],
        searchContext,
      }
      scan.history.unshift({ code, found: true, name: items[0].item_name })
    } else {
      scan.result = { found: false }
      scan.history.unshift({ code, found: false })
    }
  } catch (err) {
    console.error('runScan error:', err)
    scan.result = { found: false }
    scan.history.unshift({ code, found: false })
  }

  if (scan.history.length > 5) scan.history.length = 5
}
const resetScan = () => { scan.code = ''; scan.result = null; nextTick(() => scanInput.value?.focus()) }

const emitScanResult = () => {
  if (!scan.result?.found) return
  const item = scan.result.item
  const ctx  = scan.result.searchContext || {}
  const selectedUom = ctx.uom || item.stock_uom

  emit('add-to-cart', {
    ...item,
    uom: selectedUom,
    rate: item.uom_prices?.[selectedUom]?.rate || item.rate,
    conversion_factor: item.uom_prices?.[selectedUom]?.conversion_factor || 1,
    serial_no: ctx.serial_no || '',
    batch_no:  ctx.batch_no  || '',
    barcode:   ctx.barcode   || '',
  })
  resetScan()
}

const goAssignFromScan = () => {
  assign.barcode = scan.code
  resetScan()
  switchMode('assign')
}


// ── Auto-scan on input ──────────────────────────────────────
let scanDebounceTimer = null

watch(() => scan.code, (val) => {
  if (!val || val.trim().length < 3) return

  if (scanDebounceTimer) clearTimeout(scanDebounceTimer)
  scanDebounceTimer = setTimeout(() => {
    runScan()
  }, 300)  // ← 300ms بعد ما يوقف عن الكتابة
})

// ─────────────────────────────────────────────────────────
// C: ITEM LIST STATE
// ─────────────────────────────────────────────────────────
const list = reactive({
  search: '', filterStatus: '', filterBarcodes: '',
  page: 1, perPage: 8, totalPages: 1,
})

const filteredItems = computed(() => {
  const q  = list.search.toLowerCase().trim()
  const fs = list.filterStatus
  const fb = list.filterBarcodes
  return products.value.filter(p => {
    const matchQ  = !q || p.item_name?.toLowerCase().includes(q) || p.item_code?.toLowerCase().includes(q)
    const matchS  = !fs || (fs === 'active' ? !p.disabled : p.disabled)
    const matchB  = !fb || (fb === 'with' ? p.item_barcode?.length > 0 : !p.item_barcode?.length)
    return matchQ && matchS && matchB || false
  })
})

watch(filteredItems, (items) => {
  list.totalPages = Math.max(1, Math.ceil(items.length / list.perPage))
  list.page = 1
})

const paginatedItems = computed(() => {
  const start = (list.page - 1) * list.perPage
  return filteredItems.value.slice(start, start + list.perPage)
})

const visibleListPages = computed(() => {
  const max = 5
  let start = Math.max(1, list.page - 2)
  let end   = Math.min(list.totalPages, start + max - 1)
  if (end - start < max - 1) start = Math.max(1, end - max + 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
})

const goAssignForItem = (item) => {
  assign.selectedItem = item
  assign.itemSearch   = ''
  switchMode('assign')
}

// ─────────────────────────────────────────────────────────
// D: ASSIGN STATE
// ─────────────────────────────────────────────────────────
const assign = reactive({
  itemSearch: '', selectedItem: null,
  type: '', barcode: '', uom: '',
  loading: false, error: '', success: '',
})

const assignFilteredItems = computed(() => {
  const q = assign.itemSearch.toLowerCase().trim()
  const items = !q
    ? products
    : products.value.filter(p =>
        p.item_name?.toLowerCase().includes(q) || p.item_code?.toLowerCase().includes(q)
      )
  return items.value.slice(0, 15)
})

const assignAutoValue = async () => {
  try {
    if (!assign.type) return
    assign.error = ''; assign.success = ''
    const valueRes = await generateBarcodeValue(assign.type)
    console.log('auto-generate value result:', valueRes)
    if (valueRes.status !== 'success' || !valueRes.value){
      assign.error = 'Failed to generate value'
    }else{
      assign.barcode = valueRes.value
      assign.autoValue = valueRes.value
    }
  } catch (e) {
    assign.error = 'Failed to auto-generate value'
  }
}

const runAssign = async () => {
  if (!assign.selectedItem || !assign.barcode || !assign.type) return
  assign.loading = true; assign.error = ''; assign.success = ''
  try {
    console.log('assign', {
      "item_code": assign.selectedItem.item_code,
      "value": assign.barcode,
      "type": assign.type,
      "uom": assign.uom || null,
    })
    const res = await addItemBarcode({
      "item_code": assign.selectedItem.item_code,
      "value": assign.barcode,
      "type": assign.type,
      "uom": assign.uom || null,
    })
    console.log('Assign result:', res)
    if (res.status === 'success') {

    assign.success = `Barcode assigned to "${assign.selectedItem.item_name}"`
    assign.barcode = ''; assign.type = ''; assign.uom = ''
    assign.selectedItem = null
    }
    else {
      assign.error = res.message
    }
    emit('refresh')
  } catch (e) {
    assign.error = e?.message || 'Failed to assign barcode'
  } finally {
    assign.loading = false
  }
}


const isLoaded = ref(false)

watch(() => props.show, (isOpen) => {
  if (isOpen && !isLoaded.value) {
    loadInitialData()
  }
})

async function loadInitialData() {
  const [typesRes, fetchedUoms] = await Promise.allSettled([
    getBarcodeTypes(),
    inventoryStore.loadUOM(),
  ])

  if (typesRes.status   === 'fulfilled') barcodeTypes.value = typesRes.value?.data || []
  if (fetchedUoms.status === 'fulfilled') uoms.value        = fetchedUoms.value    || []

  isLoaded.value = true
}
</script>

<style scoped>
/* ══════════════════════════════════════════════
   OVERLAY & DIALOG SHELL
══════════════════════════════════════════════ */
.bu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(3px);
}

.bu-dialog {
  width: 95vw;
  height: 92vh;
  max-width: 1500px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  box-shadow: 0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04);
}

/* ── TOP BAR ── */
.bu-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--card-border);
  background: var(--item-bg);
  flex-shrink: 0;
}

.bu-topbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bu-topbar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background: var(--focus-ring);
  color: #fff;
}

.bu-topbar-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-main);
  letter-spacing: 0.01em;
}

.bu-topbar-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--info-bg);
  color: var(--focus-ring);
  letter-spacing: 0.08em;
}

.bu-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
}
.bu-close-btn:hover {
  background: var(--nav-item-hover-bg);
  color: var(--text-main);
}

/* ── BODY LAYOUT ── */
.bu-body {
  display: flex;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* ══════════════════════════════════════════════
   LEFT NAV PANEL
══════════════════════════════════════════════ */
.bu-nav {
  width: 180px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 8px;
  border-right: 1px solid var(--card-border);
  background: var(--item-bg);
  overflow-y: auto;
}

.bu-nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  text-align: left;
  background: transparent;
  color: var(--text-muted);
  transition: background 0.15s, color 0.15s;
  font-size: 12px;
  font-weight: 500;
  position: relative;
}

.bu-nav-item:hover {
  background: var(--nav-item-hover-bg);
  color: var(--text-sub);
}

.bu-nav-item--active {
  background: var(--info-bg);
  color: var(--focus-ring);
  font-weight: 600;
}

.bu-nav-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.bu-nav-label {
  flex: 1;
  line-height: 1.3;
}

.bu-nav-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 999px;
  background: var(--card-border);
  color: var(--text-muted);
}

.bu-nav-item--active .bu-nav-badge {
  background: var(--focus-ring);
  color: #fff;
}

.bu-nav-arrow {
  display: flex;
  align-items: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.bu-nav-item--active .bu-nav-arrow,
.bu-nav-item:hover .bu-nav-arrow {
  opacity: 1;
}

.bu-nav-stats {
  margin-top: auto;
  padding-top: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.bu-nav-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}

.bu-nav-stat-value {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
  line-height: 1;
}

.bu-nav-stat-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
}

.bu-nav-stat-divider {
  width: 1px;
  height: 24px;
  background: var(--card-border);
}

/* ══════════════════════════════════════════════
   RIGHT WORKSPACE
══════════════════════════════════════════════ */
.bu-workspace {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  scrollbar-width: thin;
}

.bu-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bu-panel-header {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--card-border);
}

.bu-panel-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.bu-panel-sub {
  font-size: 11px;
  color: var(--text-muted);
}

/* ══════════════════════════════════════════════
   SHARED FORM ELEMENTS
══════════════════════════════════════════════ */
.bu-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bu-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.bu-required {
  color: #ef4444;
}

.bu-select-wrap {
  position: relative;
}

.bu-select-wrap--sm {
  width: 130px;
}

.bu-select {
  width: 100%;
  padding: 7px 28px 7px 10px;
  border-radius: 6px;
  font-size: 12px;
  appearance: none;
  cursor: pointer;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
  outline: none;
  transition: border-color 0.15s;
}

.bu-select:focus {
  border-color: var(--focus-ring);
}

.bu-select--sm {
  padding: 6px 24px 6px 8px;
  font-size: 11px;
}

.bu-select-arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: var(--text-muted);
  pointer-events: none;
}

.bu-input {
  width: 100%;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 12px;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
  outline: none;
  transition: border-color 0.15s;
}

.bu-input:focus {
  border-color: var(--focus-ring);
}

.bu-input-group {
  display: flex;
  gap: 6px;
}

.bu-input-group .bu-input {
  flex: 1;
}

.bu-input-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--input-border);
  background: var(--input-bg);
  color: var(--text-sub);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
}

.bu-input-action:hover:not(:disabled) {
  background: var(--nav-item-hover-bg);
  border-color: var(--focus-ring);
  color: var(--focus-ring);
}

.bu-input-action:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* BUTTONS */
.bu-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: opacity 0.15s, background 0.15s;
}

.bu-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.bu-btn--primary {
  background: var(--focus-ring);
  color: #fff;
}

.bu-btn--primary:hover:not(:disabled) {
  opacity: 0.88;
}

.bu-btn--ghost {
  background: var(--item-bg);
  color: var(--text-sub);
  border: 1px solid var(--card-border);
}

.bu-btn--ghost:hover:not(:disabled) {
  background: var(--nav-item-hover-bg);
}

.bu-btn--full {
  width: 100%;
}

.bu-btn--sm {
  padding: 6px 12px;
  font-size: 11px;
}

/* SPINNER */
.bu-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: bu-spin 0.7s linear infinite;
  display: inline-block;
}

@keyframes bu-spin { to { transform: rotate(360deg); } }

/* ALERTS */
.bu-alert {
  font-size: 11px;
  padding: 8px 10px;
  border-radius: 6px;
  line-height: 1.5;
}

.bu-alert--error {
  background: #fef2f2;
  color: #ef4444;
  border: 1px solid #fecaca;
}

.bu-alert--success {
  background: var(--icon-bg-green);
  color: var(--icon-color-green);
  border: 1px solid var(--icon-color-green);
}

/* TAGS */
.bu-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--item-bg);
  color: var(--text-sub);
  border: 1px solid var(--item-border);
}

.bu-tag--muted {
  background: var(--item-bg);
  color: var(--text-muted);
  border-color: transparent;
}

.bu-tag--accent {
  background: var(--info-bg);
  color: var(--focus-ring);
  border-color: transparent;
}

.bu-mono {
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 11px;
}

/* ══════════════════════════════════════════════
   A: GENERATE VIEW
══════════════════════════════════════════════ */
.bu-gen-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

@media (max-width: 640px) {
  .bu-gen-grid { grid-template-columns: 1fr; }
}

.bu-form-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.bu-preview-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bu-preview-box {
  flex: 1;
  min-height: 160px;
  border-radius: 8px;
  border: 1.5px dashed var(--card-border);
  background: var(--item-bg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.bu-preview-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px;
}

.bu-preview-img {
  max-width: 100%;
  max-height: 100px;
  object-fit: contain;
}

.bu-preview-code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: var(--text-sub);
}

.bu-preview-type {
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.bu-preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--text-muted);
  text-align: center;
  line-height: 1.6;
}

/* ══════════════════════════════════════════════
   B: SCAN VIEW
══════════════════════════════════════════════ */
.bu-scan-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bu-scan-input-wrap {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.bu-scan-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: var(--info-bg);
  color: var(--focus-ring);
  flex-shrink: 0;
}

.bu-scan-input {
  flex: 1;
  padding: 0 14px;
  height: 36px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1.5px solid var(--focus-ring);
  outline: none;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
}

.bu-scan-input::placeholder {
  font-weight: 400;
  letter-spacing: 0;
  font-family: inherit;
  font-size: 12px;
}

.bu-scan-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
}

.bu-scan-result {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--card-border);
}

.bu-scan-result--found {
  border-color: var(--icon-color-green);
}

.bu-scan-result--notfound {
  border-color: #ef4444;
}

.bu-scan-result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-sub);
  background: var(--item-bg);
  border-bottom: 1px solid var(--card-border);
}

.bu-scan-result-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
}

.bu-scan-result-icon--ok {
  background: var(--icon-bg-green);
  color: var(--icon-color-green);
}

.bu-scan-result-icon--err {
  background: #fef2f2;
  color: #ef4444;
}

.bu-scan-result-body {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.bu-scan-item-img {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: var(--item-bg);
  border: 1px solid var(--card-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.bu-scan-item-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bu-scan-item-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.bu-scan-item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bu-scan-item-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}

.bu-scan-bc-info {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.bu-scan-actions,
.bu-scan-nf-actions {
  display: flex;
  gap: 8px;
  padding: 10px 14px;
  border-top: 1px solid var(--card-border);
  background: var(--item-bg);
}

.bu-scan-history {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bu-scan-history-title {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  font-weight: 600;
}

.bu-scan-history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.bu-scan-history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  border-radius: 5px;
  font-size: 11px;
  cursor: pointer;
  border: none;
  text-align: left;
  transition: background 0.12s;
  background: var(--item-bg);
  color: var(--text-sub);
}

.bu-scan-history-item:hover {
  background: var(--nav-item-hover-bg);
}

.bu-scan-history-item--err {
  color: var(--text-muted);
}

/* ══════════════════════════════════════════════
   C: ITEM LIST VIEW
══════════════════════════════════════════════ */
.bu-list-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.bu-search-wrap {
  position: relative;
  flex: 1;
  min-width: 160px;
}

.bu-search-wrap--full {
  width: 100%;
}

.bu-search-icon {
  position: absolute;
  left: 9px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  pointer-events: none;
}

.bu-search-input {
  width: 100%;
  padding: 7px 10px 7px 28px;
  border-radius: 6px;
  font-size: 12px;
  background: var(--input-bg);
  color: var(--text-main);
  border: 1px solid var(--input-border);
  outline: none;
  transition: border-color 0.15s;
}

.bu-search-input:focus {
  border-color: var(--focus-ring);
}

.bu-table-wrap {
  border-radius: 7px;
  overflow: hidden;
  border: 1px solid var(--card-border);
}

.bu-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.bu-th {
  padding: 8px 12px;
  text-align: left;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: var(--item-bg);
  border-bottom: 1px solid var(--card-border);
  white-space: nowrap;
}

.bu-th--right { text-align: right; }

@media (max-width: 500px) {
  .bu-th--hide-sm { display: none; }
}

.bu-tr {
  transition: background 0.12s;
}

.bu-tr:hover {
  background: var(--nav-item-hover-bg);
}

.bu-td {
  padding: 8px 12px;
  color: var(--text-sub);
  border-bottom: 1px solid var(--card-border);
  vertical-align: middle;
}

@media (max-width: 500px) {
  .bu-td--hide-sm { display: none; }
}

.bu-td--right { text-align: right; }

.bu-td-empty {
  padding: 40px 12px;
  text-align: center;
  color: var(--text-muted);
  font-size: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.bu-item-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bu-item-thumb {
  width: 28px;
  height: 28px;
  border-radius: 5px;
  background: var(--item-bg);
  border: 1px solid var(--card-border);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.bu-item-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.bu-item-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 180px;
}

.bu-code-pill {
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--item-bg);
  color: var(--text-muted);
  border: 1px solid var(--item-border);
  white-space: nowrap;
}

.bu-code-pill--xs {
  font-size: 9px;
  padding: 1px 5px;
}

.bu-bc-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
}

.bu-bc-count--has {
  background: var(--info-bg);
  color: var(--focus-ring);
}

.bu-bc-count--none {
  background: var(--warning-bg);
  color: var(--warning-border);
}

.bu-status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.bu-status-dot--on {
  background: var(--icon-color-green);
}

.bu-status-dot--off {
  background: var(--text-muted);
}

.bu-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--focus-ring);
  transition: background 0.12s;
}

.bu-action-btn:hover {
  background: var(--info-bg);
}

.bu-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding-top: 4px;
}

.bu-page-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  color: var(--text-sub);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.bu-page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.bu-page-btn--active {
  background: var(--focus-ring);
  color: #fff;
  border-color: var(--focus-ring);
}

/* ══════════════════════════════════════════════
   D: ASSIGN VIEW
══════════════════════════════════════════════ */
.bu-assign-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 16px;
}

@media (max-width: 700px) {
  .bu-assign-grid { grid-template-columns: 1fr; }
}

.bu-step {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: var(--item-bg);
  transition: opacity 0.2s;
  align-items: flex-start;
}

.bu-step--disabled {
  opacity: 0.4;
  pointer-events: none;
}

.bu-step-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--focus-ring);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}

.bu-step-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.bu-step-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-main);
  margin-bottom: 2px;
}

.bu-assign-item-search {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.bu-assign-item-list {
  max-height: 160px;
  overflow-y: auto;
  border-radius: 6px;
  border: 1px solid var(--card-border);
  background: var(--card-bg);
  scrollbar-width: thin;
}

.bu-assign-item-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  border-bottom: 1px solid var(--card-border);
  transition: background 0.12s;
  gap: 6px;
}

.bu-assign-item-btn:last-child {
  border-bottom: none;
}

.bu-assign-item-btn:hover {
  background: var(--nav-item-hover-bg);
}

.bu-assign-item-btn--active {
  background: var(--info-bg);
}

.bu-assign-item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.bu-assign-item-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.bu-assign-item-bc {
  font-size: 10px;
  color: var(--text-muted);
  white-space: nowrap;
}

.bu-assign-selected {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: 5px;
  background: var(--icon-bg-green);
  color: var(--icon-color-green);
  font-size: 11px;
  font-weight: 600;
}

.bu-assign-summary {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 6px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
}

.bu-assign-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.bu-assign-summary-row span:first-child {
  color: var(--text-muted);
}

.bu-assign-summary-row strong {
  color: var(--text-main);
  font-family: 'JetBrains Mono', monospace;
}

.bu-assign-summary-placeholder {
  font-size: 11px;
  color: var(--text-muted);
  padding: 10px;
  text-align: center;
  border-radius: 6px;
  border: 1px dashed var(--card-border);
}

/* ══════════════════════════════════════════════
   TRANSITIONS
══════════════════════════════════════════════ */
/* overlay */
.bu-overlay-enter-active,
.bu-overlay-leave-active { transition: opacity 0.2s ease; }
.bu-overlay-enter-from,
.bu-overlay-leave-to { opacity: 0; }

/* dialog */
.bu-dialog-enter-active,
.bu-dialog-leave-active { transition: opacity 0.2s ease, transform 0.22s ease; }
.bu-dialog-enter-from,
.bu-dialog-leave-to { opacity: 0; transform: scale(0.97) translateY(8px); }

/* panel switch */
.bu-panel-enter-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.bu-panel-leave-active { transition: opacity 0.12s ease; }
.bu-panel-enter-from { opacity: 0; transform: translateX(8px); }
.bu-panel-leave-to { opacity: 0; }

/* scan result */
.bu-fade-enter-active,
.bu-fade-leave-active { transition: opacity 0.18s ease, transform 0.18s ease; }
.bu-fade-enter-from { opacity: 0; transform: translateY(-4px); }
.bu-fade-leave-to { opacity: 0; }

/* ══════════════════════════════════════════════
   RESPONSIVE: MOBILE NAV COLLAPSE
══════════════════════════════════════════════ */
@media (max-width: 540px) {
  .bu-dialog {
    max-height: 95vh;
    border-radius: 10px;
  }

  .bu-body {
    flex-direction: column;
  }

  .bu-nav {
    width: 100%;
    flex-direction: row;
    padding: 8px;
    gap: 4px;
    overflow-x: auto;
    border-right: none;
    border-bottom: 1px solid var(--card-border);
    scrollbar-width: none;
  }

  .bu-nav::-webkit-scrollbar { display: none; }

  .bu-nav-item {
    flex-direction: column;
    gap: 3px;
    padding: 6px 10px;
    font-size: 10px;
    min-width: fit-content;
    white-space: nowrap;
    align-items: center;
  }

  .bu-nav-arrow { display: none; }

  .bu-nav-stats {
    display: none;
  }

  .bu-workspace {
    max-height: calc(95vh - 140px);
  }

  .bu-panel {
    padding: 14px;
  }
}
</style>
