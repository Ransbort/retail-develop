<template>
  <Teleport to="body">
    <Transition name="backdrop-fade">
      <div
        v-if="internalDialog"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        :class="isDark ? 'theme-dark' : 'theme-light'"
        @click.self="handleOutsideClick"
      >
        <Transition name="modal-slide">
          <div
            v-if="internalDialog"
            class="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            :style="{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }"
          >
            <!-- ── Header ── -->
            <div class="flex items-center gap-3 px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
              <div
                class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0
                       bg-cyan-50 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"
              >
                {{ avatarInitials }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                  {{ customerName ? __('Update customer') : __('New customer') }}
                </p>
                <p class="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                  {{ customerName ? __('Edit customer details below') : __('Fill in the details to add a new customer') }}
                </p>
              </div>
              <button
                @click="closeDialog"
                class="w-8 h-8 flex items-center justify-center rounded-lg
                       text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100
                       dark:text-zinc-500 dark:hover:text-zinc-300 dark:hover:bg-zinc-800
                       transition-colors"
              >
              <X class="w-5 h-5" />
              </button>
            </div>

            <!-- ── Body ── -->
            <div class="overflow-y-auto" style="max-height: 65vh;">

              <!-- Customer Info -->
              <div class="px-5 py-4">
                <p class="section-label">{{ __('Customer info') }}</p>
                <div class="flex flex-col gap-3">

                  <div class="field-wrap">
                    <label class="field-label">{{ __('Customer name') }} <span class="text-red-400">*</span></label>
                    <input
                      v-model="form.customer_name"
                      type="text"
                      :placeholder="__('e.g. Mohamed Ali')"
                      class="field-input"
                      :class="{ 'field-input-error': errors.customer_name }"
                    />
                    <p v-if="errors.customer_name" class="error-msg">{{ errors.customer_name }}</p>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="field-wrap">
                      <label class="field-label">{{ __('Territory') }}</label>
                      <select v-model="form.territory" class="field-input">
                        <option value="">— {{ __('select') }} —</option>
                        <option v-for="t in territories" :key="t.name" :value="t.name">{{ t.name }}</option>
                      </select>
                    </div>
                    <div class="field-wrap">
                      <label class="field-label">{{ __('Customer type') }}</label>
                      <select v-model="form.customer_type" class="field-input">
                        <option value="Individual">{{ __('Individual') }}</option>
                        <option value="Company">{{ __('Company') }}</option>
                      </select>
                    </div>
                  </div>

                </div>
              </div>

              <!-- Contact -->
              <div class="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
                <div class="flex items-center gap-2 mb-3">
                  <p class="section-label" style="margin-bottom:0">{{ __('Contact') }}</p>
                  <span class="text-[10px] font-medium px-2 py-0.5 rounded-full
                               bg-cyan-50 text-cyan-700 border border-cyan-100
                               dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800">
                    {{ __('primary') }}
                  </span>
                </div>

                <div class="flex flex-col gap-3">
                  <div class="grid grid-cols-2 gap-3">
                    <div class="field-wrap">
                      <label class="field-label">{{ __('First name') }}</label>
                      <input v-model="form.first_name" type="text" class="field-input" />
                    </div>
                    <div class="field-wrap">
                      <label class="field-label">{{ __('Last name') }}</label>
                      <input v-model="form.last_name" type="text" class="field-input" />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-3">
                    <div class="field-wrap">
                      <label class="field-label">{{ __('Primary mobile') }} <span class="text-red-400">*</span></label>
                      <input
                        v-model="form.primary_mobile"
                        type="tel"
                        placeholder="010xxxxxxxx"
                        class="field-input"
                        :class="{ 'field-input-error': errors.primary_mobile }"
                      />
                      <p v-if="errors.primary_mobile" class="error-msg">{{ errors.primary_mobile }}</p>
                    </div>
                    <div class="field-wrap">
                      <label class="field-label">{{ __('Secondary mobile') }}</label>
                      <input v-model="form.secondary_mobile" type="tel" placeholder="011xxxxxxxx" class="field-input" />
                    </div>
                  </div>

                  <div class="field-wrap">
                    <label class="field-label">{{ __('Email') }}</label>
                    <input v-model="form.email_id" type="email" placeholder="email@example.com" class="field-input" />
                  </div>
                </div>
              </div>

              <!-- Address (optional) -->
              <div class="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800">
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-1.5">
                    <p class="section-label" style="margin-bottom:0">{{ __('Address') }}</p>
                    <span class="text-[10px] text-zinc-400 dark:text-zinc-500">({{ __('optional') }})</span>
                  </div>
                  <button
                    v-if="addrName && showAddress"
                    @click="removeAddress"
                    class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg
                          border border-red-200 text-red-500
                          hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/20
                          transition-colors"
                  >
                    <i class="ti ti-trash text-xs"></i>
                     {{ showAddress ? __('Remove') : __('Add address') }}
                  </button>
                </div>

                <Transition name="address-expand">
                  <div v-if="showAddress" class="flex flex-col gap-3">
                    <div class="field-wrap">
                      <label class="field-label">{{ __('Address line 1') }} <span class="text-red-400">*</span></label>
                      <input
                        v-model="form.address_line1"
                        type="text"
                        :placeholder="__('Street, building...')"
                        class="field-input"
                        :class="{ 'field-input-error': errors.address_line1 }"
                      />
                      <p v-if="errors.address_line1" class="error-msg">{{ errors.address_line1 }}</p>
                    </div>

                    <div class="field-wrap">
                      <label class="field-label">{{ __('Address line 2') }}</label>
                      <input v-model="form.address_line2" type="text" :placeholder="__('Apartment, floor...')" class="field-input" />
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div class="field-wrap">
                        <label class="field-label">{{ __('City') }} <span class="text-red-400">*</span></label>
                        <input
                          v-model="form.city"
                          type="text"
                          class="field-input"
                          :class="{ 'field-input-error': errors.city }"
                        />
                        <p v-if="errors.city" class="error-msg">{{ errors.city }}</p>
                      </div>
                      <div class="field-wrap">
                        <label class="field-label">{{ __('State') }}</label>
                        <input v-model="form.state" type="text" class="field-input" />
                      </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                      <div class="field-wrap">
                        <label class="field-label">{{ __('Country') }}</label>
                        <select v-model="form.country" class="field-input">
                          <option v-for="c in countries" :key="c.name" :value="c.name">{{ c.name }}</option>
                        </select>
                      </div>
                      <div class="field-wrap">
                        <label class="field-label">{{ __('Pincode') }}</label>
                        <input v-model="form.pincode" type="text" class="field-input" />
                      </div>
                    </div>
                  </div>
                </Transition>
              </div>

            </div>

            <!-- ── Footer ── -->
            <div
              class="flex justify-end items-center gap-2 px-5 py-3.5
                     border-t border-zinc-100 dark:border-zinc-800
                     bg-zinc-50 dark:bg-zinc-800/50"
            >
              <button
                @click="closeDialog"
                class="px-4 py-2 rounded-lg text-sm font-medium transition-colors
                       text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100
                       dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-800"
              >
                {{ __('Cancel') }}
              </button>
              <button
                @click="submitUpdate"
                :disabled="saving"
                class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                      0 active:scale-95
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all"
                  :style="{ background: primaryColor, color: '#fff', borderColor: primaryColor }"
              >
                <svg v-if="saving" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <i v-else class="ti ti-device-floppy text-sm"></i>
                {{ saving ? __('Saving...') : __('Save customer') }}
              </button>
            </div>

          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed, nextTick } from 'vue'
import { useToast } from 'vue-toastification'
import { call, createListResource, createDocumentResource } from 'frappe-ui'
import { useShiftStore } from '@/stores/shift.js'
import { useSettingsStore } from '@/stores/settings'
import { X } from 'lucide-vue-next'
const toast = useToast()
const settingsStore = useSettingsStore()
const props = defineProps({
  modelValue:      { type: Boolean, default: false },
  customerId:      { type: [String, Number, null], default: null },
  customerInfo:    { type: Object, default: () => ({}) },
  customers:       { type: Array,  default: () => [] },
  pos_profile_doc: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'customer-added', 'customer-updated', 'clickOutside'])

const isDark = computed(() => settingsStore.settings?.appearance?.theme === 'dark')
const primaryColor = computed(() => settingsStore.settings?.appearance?.primaryColor || '#06b6d4')
const internalDialog     = ref(props.modelValue)
const saving             = ref(false)
const customerName       = ref(props.customerId)
const territories        = ref([])
const countries          = ref([])
const showAddress        = ref(false)
const errors             = ref({})

const getDefaultForm = () => ({
  customer_name:    '',
  territory:        '',
  customer_type:    'Individual',
  first_name:       '',
  last_name:        '',
  primary_mobile:   '',
  secondary_mobile: '',
  email_id:         '',
  address_line1:    '',
  address_line2:    '',
  city:             '',
  state:            '',
  country:          'Egypt',
  pincode:          '',
})

const form = ref(getDefaultForm())

const avatarInitials = computed(() => {
  const name = form.value.customer_name || ''
  return name.trim().split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'NA'
})

const resetForm = () => {
  form.value         = getDefaultForm()
  customerName.value = null
  showAddress.value  = false
  errors.value       = {}
}

const loadTerritories = async () => {
  if (territories.value.length) return
  try {
    const r = createListResource({ doctype: 'Territory', fields: JSON.stringify(['name']), auto: true, limit_page_length: 100 })
    await r.list.promise
    territories.value = r.data || []
  } catch (e) { console.warn('Territories load error', e) }
}

const loadCountries = async () => {
  if (countries.value.length) return
  try {
    const r = createListResource({
      doctype: 'Country',
      fields: ['name'],
      pageLength: 300,
      auto: false,
    })
    await r.fetch()
    await r.list.promise
    countries.value = r.data || []
  } catch (e) {
    console.warn('Countries load error', e)
  }
}

const loadCustomerData = async () => {
  await nextTick()
  customerName.value = props.customerId || null
  if (!customerName.value) { resetForm(); return }

  try {
    const data = await call('retail.retail.api.posapp.get_customer_info', {
      customer: customerName.value
    })

    form.value.customer_name = data.customer_name || customerName.value
    form.value.territory     = data.territory     || ''
    form.value.customer_type = data.customer_type || 'Individual'

    const primary = (data.contacts || []).find(c => c.is_primary_contact) || data.contacts?.[0]
    if (primary) {
      form.value.first_name       = primary.first_name || ''
      form.value.last_name        = primary.last_name  || ''
      form.value.primary_mobile   = primary.mobile_no  || primary.phone || ''
      form.value.secondary_mobile = primary.phone && primary.mobile_no !== primary.phone ? primary.phone : ''
      form.value.email_id         = primary.email_id   || ''

      const addr = (data.addresses || []).find(a => a.name === primary.address) || data.addresses?.[0]
      if (addr) {
        addrName.value           = addr.name
        showAddress.value        = true
        form.value.address_line1 = addr.address_line1 || ''
        form.value.address_line2 = addr.address_line2 || ''
        form.value.city          = addr.city          || ''
        form.value.state         = addr.state         || ''
        form.value.country       = addr.country       || 'Egypt'
        form.value.pincode       = addr.pincode       || ''
      }
    }
  } catch (e) {
    console.error('loadCustomerData error', e)
    toast.error(__('Failed to load customer data'))
  }
}

const validate = () => {
  errors.value = {}
  if (!form.value.customer_name?.trim())  errors.value.customer_name  = __('Customer name is required')
  if (!form.value.primary_mobile?.trim()) errors.value.primary_mobile = __('Primary mobile is required')
  if (showAddress.value) {
    if (!form.value.address_line1?.trim()) errors.value.address_line1 = __('Address line 1 is required')
    if (!form.value.city?.trim())          errors.value.city           = __('City is required')
  }
  return Object.keys(errors.value).length === 0
}

const submitUpdate = async () => {
  if (!validate()) return

  saving.value = true
  try {
    const shiftStore = useShiftStore()
    const isUpdate   = !!customerName.value

    const savedCustomer = await shiftStore.createUpdateCustomer({
      method:          isUpdate ? 'update' : 'create',
      customer_id:     customerName.value || '',
      customer_name:   form.value.customer_name,
      pos_profile_doc: props.pos_profile_doc || {},
      territory:       form.value.territory     || '',
      customer_type:   form.value.customer_type || 'Individual',
      first_name:      form.value.first_name    || '',
      last_name:       form.value.last_name     || '',
      first_mobile:    form.value.primary_mobile,
      second_mobile:   form.value.secondary_mobile || '',
      email_id:        form.value.email_id         || '',
      city:            showAddress.value ? form.value.city          : '',
      address_line1:   showAddress.value ? form.value.address_line1 : '',
      address_line2:   showAddress.value ? form.value.address_line2 : '',
      state:           showAddress.value ? form.value.state         : '',
      country:         showAddress.value ? form.value.country       : '',
      pincode:         showAddress.value ? form.value.pincode       : '',
    })

    if (!savedCustomer) throw new Error('No response')

    toast.success(isUpdate ? __('Customer updated successfully') : __('Customer created successfully'))
    emit(isUpdate ? 'customer-updated' : 'customer-added', {
      ...savedCustomer,
      name:          savedCustomer.name || customerName.value,
      customer_name: form.value.customer_name,
    })
    closeDialog()
  } catch (e) {
    console.error('Save error:', e)
    toast.error(__('Failed to save. Please try again.'))
  } finally {
    saving.value = false
  }
}
const addrName = ref(null)

const removeAddress = async () => {
  if (!addrName.value) {
    showAddress.value = false
    return
  }

  try {
    const addrDoc = createDocumentResource({
      doctype: 'Address',
      name: addrName.value,
    })

    await addrDoc.delete.submit()

    addrName.value    = null
    showAddress.value = false
    form.value.address_line1 = ''
    form.value.address_line2 = ''
    form.value.city          = ''
    form.value.state         = ''
    form.value.pincode       = ''
    toast.success(__('Address removed'))
  } catch (e) {
    console.error(e)
    toast.error(e.messages[0])
  }
}

watch(() => props.modelValue, (val) => {
  internalDialog.value = val
  if (val) { loadTerritories(); loadCountries(); loadCustomerData() }
  else resetForm()
})

watch(internalDialog, (val) => { if (!val) emit('close') })

const closeDialog = () => { internalDialog.value = false; emit('close'); resetForm() }
const handleOutsideClick = () => { emit('clickOutside'); closeDialog() }
</script>

<style scoped>
.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--tw-color-zinc-400, #a1a1aa);
  margin-bottom: 10px;
}

.field-wrap { display: flex; flex-direction: column; gap: 4px; }

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: rgb(82 82 91);
}
.dark .field-label { color: rgb(161 161 170); }

.field-input {
  width: 100%;
  padding: 7px 11px;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  background: #fff;
  color: rgb(24 24 27);
  border: 1px solid rgb(228 228 231);
  transition: border-color 0.15s, box-shadow 0.15s;
  box-sizing: border-box;
}
.dark .field-input {
  background: rgb(39 39 42);
  color: rgb(244 244 245);
  border-color: rgb(63 63 70);
}
.field-input:focus {
  border-color: rgb(8 145 178);
  box-shadow: 0 0 0 2px rgb(8 145 178 / 0.15);
}
.field-input-error { border-color: rgb(248 113 113) !important; }

.field-input option {
  background: #fff;
  color: rgb(24 24 27);
}
.dark .field-input option {
  background: rgb(39 39 42);
  color: rgb(244 244 245);
}

.error-msg { font-size: 11px; color: rgb(248 113 113); }

/* Transitions */
.backdrop-fade-enter-active, .backdrop-fade-leave-active { transition: opacity 0.2s ease; }
.backdrop-fade-enter-from, .backdrop-fade-leave-to { opacity: 0; }

.modal-slide-enter-active { transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1); }
.modal-slide-leave-active { transition: all 0.15s ease; }
.modal-slide-enter-from { opacity: 0; transform: scale(0.94) translateY(12px); }
.modal-slide-leave-to { opacity: 0; transform: scale(0.97) translateY(6px); }

.address-expand-enter-active, .address-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}
.address-expand-enter-from, .address-expand-leave-to {
  opacity: 0;
  max-height: 0;
}
.address-expand-enter-to, .address-expand-leave-from {
  opacity: 1;
  max-height: 500px;
}

.overflow-y-auto::-webkit-scrollbar { width: 4px; }
.overflow-y-auto::-webkit-scrollbar-track { background: transparent; }
.overflow-y-auto::-webkit-scrollbar-thumb { background: rgb(228 228 231); border-radius: 4px; }
.dark .overflow-y-auto::-webkit-scrollbar-thumb { background: rgb(63 63 70); }
</style>
