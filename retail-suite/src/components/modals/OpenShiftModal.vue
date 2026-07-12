
<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(0,0,0,0.55); backdrop-filter: blur(30px);"
      @click.self="handleBackgroundClick"
    >
      <div
        class="relative w-full rounded-xl overflow-hidden flex flex-col"
        style="
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
          max-width: 780px;
          max-height: 90vh;
        "
      >
        <!-- Header -->
        <div
          class="px-5 py-3 flex items-center justify-between flex-shrink-0"
          style="border-bottom: 1px solid var(--card-border); background: var(--item-bg);"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style="background: var(--icon-bg-green);"
            >
              <PlayIcon class="w-4 h-4" style="color: var(--icon-color-green);" />
            </div>
            <div>
              <h3 class="text-sm font-bold" style="color: var(--text-main);">Open Shift</h3>
              <p class="text-xs" style="color: var(--text-muted);">Start a new cashier shift</p>
            </div>
          </div>
          <button
            class="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            style="color: var(--text-muted); background: transparent;"
            @mouseover="$event.currentTarget.style.background = 'var(--nav-item-hover-bg)'"
            @mouseleave="$event.currentTarget.style.background = 'transparent'"
            @click="$emit('close')"
            :disabled="isLoading"
          >
            <CloseIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Body — horizontal layout -->
        <div class="flex flex-1 min-h-0 overflow-hidden">

          <!-- LEFT: Company + Profile + Time + Toggle -->
          <div
            class="flex flex-col gap-4 p-5 overflow-y-auto"
            style="
              width: 280px;
              flex-shrink: 0;
              border-right: 1px solid var(--card-border);
              scrollbar-width: thin;
            "
          >
            <!-- Company -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-muted);">
                Company <span style="color: #ef4444;">*</span>
              </label>
              <select
                v-model="company"
                class="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                style="background: var(--input-bg); color: var(--text-main); border: 1px solid var(--input-border);"
                :disabled="isLoading"
                required
              >
                <option value="" disabled>Select Company</option>
                <option v-for="c in companies" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>

            <!-- POS Profile -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-muted);">
                POS Profile <span style="color: #ef4444;">*</span>
              </label>
              <select
                v-model="pos_profile"
                class="w-full px-3 py-2 rounded-lg text-xs focus:outline-none"
                style="background: var(--input-bg); color: var(--text-main); border: 1px solid var(--input-border);"
                :disabled="!pos_profiles.length || isLoading"
              >
                <option value="" disabled>Select POS Profile</option>
                <option v-for="p in pos_profiles" :key="p" :value="p">{{ p }}</option>
              </select>
            </div>

            <!-- Notes -->
            <div class="flex flex-col gap-1.5">
              <label class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-muted);">
                Notes <span class="normal-case font-normal">(Optional)</span>
              </label>
              <textarea
                v-model="notes"
                class="w-full px-3 py-2 rounded-lg text-xs focus:outline-none resize-none"
                style="background: var(--input-bg); color: var(--text-main); border: 1px solid var(--input-border);"
                rows="2"
                :disabled="isLoading"
                placeholder="Any notes..."
              />
            </div>

            <!-- Require Balance Toggle -->
            <div
              class="flex items-center justify-between px-3 py-2.5 rounded-lg"
              style="background: var(--item-bg); border: 1px solid var(--card-border);"
            >
              <div>
                <div class="text-xs font-semibold" style="color: var(--text-main);">Require Balance</div>
                <div class="text-xs" style="color: var(--text-muted);">Make amount mandatory</div>
              </div>
              <ToggleSwitch v-model="requireBalance" />
            </div>

            <!-- Current Time -->
            <div
              class="flex items-center gap-2 px-3 py-2 rounded-lg mt-auto"
              style="background: var(--info-bg); border: 1px solid var(--focus-ring);"
            >
              <ClockIcon class="w-3.5 h-3.5 flex-shrink-0" style="color: var(--focus-ring);" />
              <span class="text-xs font-medium" style="color: var(--focus-ring);">{{ currentTime }}</span>
            </div>
          </div>

          <!-- RIGHT: Payment Methods -->
          <div class="flex flex-col flex-1 min-w-0 p-5 overflow-y-auto" style="scrollbar-width: thin;">

            <div class="flex items-center justify-between mb-3">
              <label class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-muted);">
                Opening Balance
              </label>

              <!-- Hint -->
              <div
                v-if="pos_profile"
                class="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs"
                style="background: var(--warning-bg); color: var(--warning-border); border: 1px solid var(--warning-border);"
              >
                <svg class="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
                <span>
                  Add methods in
                  <strong>{{ pos_profile }}</strong>
                  POS Profile
                </span>
              </div>
            </div>

            <!-- Empty state -->
            <div
              v-if="!payments_methods.length"
              class="flex-1 flex flex-col items-center justify-center gap-2 rounded-lg"
              style="background: var(--item-bg); border: 1px dashed var(--card-border);"
            >
              <svg class="w-8 h-8" style="color: var(--text-muted); opacity: 0.4;"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <path d="M2 10h20"/>
              </svg>
              <p class="text-xs text-center" style="color: var(--text-muted);">
                Select a POS Profile to load payment methods
              </p>
              <p v-if="pos_profile" class="text-xs text-center" style="color: var(--text-muted);">
                No payment methods found in
                <span class="font-semibold" style="color: var(--text-sub);">{{ pos_profile }}</span>
              </p>
            </div>

            <!-- Payment rows -->
            <div v-else class="flex flex-col gap-2">
              <div
                v-for="m in payments_methods"
                :key="m.mode_of_payment"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                style="background: var(--item-bg); border: 1px solid var(--card-border);"
              >
                <!-- Icon -->
                <div
                  class="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
                  style="background: var(--info-bg);"
                >
                  <svg class="w-3.5 h-3.5" style="color: var(--focus-ring);"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <path d="M2 10h20"/>
                  </svg>
                </div>

                <!-- Label -->
                <div class="flex flex-col flex-shrink-0" style="width: 100px;">
                  <span class="text-xs font-semibold" style="color: var(--text-main);">
                    {{ m.mode_of_payment }}
                  </span>
                  <span class="text-xs" style="color: var(--text-muted);">{{ m.currency }}</span>
                </div>

                <!-- Input -->
                <input
                  v-model.number="m.amount"
                  type="number"
                  min="0"
                  step="0.01"
                  class="flex-1 px-3 py-1.5 rounded-md text-sm font-mono focus:outline-none"
                  style="background: var(--input-bg); color: var(--text-main); border: 1px solid var(--input-border);"
                  :disabled="isLoading"
                  placeholder="0.00"
                />
              </div>

              <!-- Total -->
              <div
                class="flex items-center justify-between px-3 py-2 rounded-lg mt-1"
                style="background: var(--card-bg); border: 1px solid var(--card-border);"
              >
                <span class="text-xs font-semibold" style="color: var(--text-muted);">Total Opening Balance</span>
                <span class="text-sm font-bold font-mono" style="color: var(--text-main);">
                  {{ totalBalance.toFixed(2) }}
                </span>
              </div>
            </div>

            <!-- Spacer -->
            <div class="flex-1" />

            <!-- Error -->
            <div
              v-if="errorMessage"
              class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs mt-3"
              style="background: #fef2f2; border: 1px solid #fecaca; color: #ef4444;"
            >
              <AlertIcon class="w-4 h-4 flex-shrink-0" />
              {{ errorMessage }}
            </div>

            <!-- Success -->
            <div
              v-if="successMessage"
              class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs mt-3"
              style="background: var(--icon-bg-green); border: 1px solid var(--icon-color-green); color: var(--icon-color-green);"
            >
              <CheckIcon class="w-4 h-4 flex-shrink-0" />
              {{ successMessage }}
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-3 px-5 py-3 flex-shrink-0"
          style="border-top: 1px solid var(--card-border); background: var(--item-bg);"
        >
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 rounded-lg text-xs font-semibold transition-colors"
            style="background: var(--card-bg); color: var(--text-sub); border: 1px solid var(--card-border);"
            @mouseover="$event.currentTarget.style.background = 'var(--nav-item-hover-bg)'"
            @mouseleave="$event.currentTarget.style.background = 'var(--card-bg)'"
            :disabled="isLoading"
          >
            Cancel
          </button>
          <button
            @click="submit_dialog"
            :disabled="!canSubmit || isLoading"
            class="px-5 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-opacity"
            style="background: var(--icon-color-green); color: #fff;"
            :style="(!canSubmit || isLoading) ? { opacity: '0.45', cursor: 'not-allowed' } : { opacity: '1' }"
          >
            <LoadingSpinner v-if="isLoading" class="w-3.5 h-3.5" />
            <PlayIcon v-else class="w-3.5 h-3.5" />
            {{ isLoading ? 'Opening…' : 'Open Shift' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useShiftStore }                               from '@/stores/shift'
import ClockIcon      from '@/components/icons/ClockIcon.svg'
import PlayIcon       from '@/components/icons/PlayIcon.svg'
import LoadingSpinner from '@/components/icons/LoadingSpinner.vue'
import ToggleSwitch   from '@/components/icons/ToggleSwitch.vue'
import CheckIcon      from '@/components/icons/CheckIcon.svg'
import CloseIcon      from '@/components/icons/CloseIcon.svg'
import AlertIcon      from '@/components/icons/AlertIcon.svg'

const emit = defineEmits(['close', 'success', 'error'])

const shiftStore = useShiftStore()

const companies            = ref([])
const company              = ref('')
const pos_profiles_data    = ref([])
const payments_method_data = ref([])
const pos_profile          = ref('')
const payments_methods     = ref([])
const pos_profiles         = ref([])
const notes                = ref('')
const requireBalance       = ref(false)
const isLoading            = ref(false)
const errorMessage         = ref('')
const successMessage       = ref('')
const currentTime          = ref('')

watch(company, (val) => {
  pos_profiles.value = pos_profiles_data.value
    .filter(el => el.company === val)
    .map(el => el.name)
  pos_profile.value = pos_profiles.value[0] || ''
})

watch(pos_profile, (val) => {
  payments_methods.value = payments_method_data.value
    .filter(el => el.parent === val)
    .map(el => ({
      mode_of_payment: el.mode_of_payment,
      amount: 0,
      currency: el.currency,
    }))
})

const totalBalance = computed(() =>
  payments_methods.value.reduce((s, m) => s + (m.amount || 0), 0)
)

const canSubmit = computed(() => {
  if (!company.value || !pos_profile.value) return false
  if (!payments_methods.value.length) return false
  if (requireBalance.value && totalBalance.value <= 0) return false
  return !isLoading.value
})

const updateCurrentTime = () => {
  currentTime.value = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Riyadh',
    weekday:  'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  })
}

let timeInterval

onMounted(async () => {
  updateCurrentTime()
  timeInterval = setInterval(updateCurrentTime, 1000)
  try {
    const data = await shiftStore.getOpeningDialogData()
    companies.value            = data.companies.map(el => el.name)
    pos_profiles_data.value    = data.pos_profiles_data
    payments_method_data.value = data.payments_method
    if (companies.value.length === 1) company.value = companies.value[0]
  } catch (e) {
    errorMessage.value = 'Failed to load data. Please try again.'
  }
})

onUnmounted(() => clearInterval(timeInterval))

const submit_dialog = async () => {
  errorMessage.value   = ''
  successMessage.value = ''
  if (!canSubmit.value) return
  isLoading.value = true
  try {
    const newShift = await shiftStore.openShift({
      pos_profile:     pos_profile.value,
      company:         company.value,
      balance_details: JSON.stringify(payments_methods.value),
    })
    if (newShift) {
      successMessage.value = 'Shift opened successfully!'
      setTimeout(() => { emit('success', newShift); emit('close') }, 800)
    }
  } catch (error) {
    errorMessage.value = error.message || 'Failed to open shift. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleBackgroundClick = () => {
  if (!isLoading.value) emit('close')
}
</script>
