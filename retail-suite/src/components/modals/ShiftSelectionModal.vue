<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      style="background: rgba(0,0,0,0.55); backdrop-filter: blur(30px);"
      @click.self="$emit('close')"
    >
      <div
        class="relative w-full rounded-xl overflow-hidden flex flex-col"
        style="
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          box-shadow: 0 24px 64px rgba(0,0,0,0.35);
          max-width: 480px;
        "
      >
        <!-- Header -->
        <div
          class="px-5 py-3 flex items-center justify-between flex-shrink-0"
          style="border-bottom: 1px solid var(--card-border); background: var(--item-bg);"
        >
          <div class="flex items-center gap-3">
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center"
              style="background: var(--info-bg);"
            >
              <Monitor class="w-4 h-4" style="color: var(--focus-ring);" />
            </div>
            <div>
              <h3 class="text-sm font-bold" style="color: var(--text-main);">Select Shift</h3>
              <p class="text-xs" style="color: var(--text-muted);">
                {{ currentIndex + 1 }} of {{ shifts.length }} open shift{{ shifts.length > 1 ? 's' : '' }}
              </p>
            </div>
          </div>
          <button
            class="w-7 h-7 rounded-lg flex items-center justify-center"
            style="color: var(--text-muted); background: transparent;"
            @mouseover="$event.currentTarget.style.background = 'var(--nav-item-hover-bg)'"
            @mouseleave="$event.currentTarget.style.background = 'transparent'"
            @click="$emit('close')"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <!-- Carousel -->
        <div class="flex items-center gap-2 px-3 py-5">

          <!-- Left Arrow -->
          <button
            class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            :style="currentIndex === 0
              ? { background: 'var(--item-bg)', color: 'var(--text-muted)', opacity: '0.35', cursor: 'not-allowed' }
              : { background: 'var(--item-bg)', color: 'var(--text-sub)', border: '1px solid var(--card-border)', cursor: 'pointer' }"
            :disabled="currentIndex === 0"
            @click="prev"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <!-- Card -->
          <div class="flex-1 min-w-0">
            <Transition :name="direction === 'next' ? 'slide-left' : 'slide-right'" mode="out-in">
              <div
                :key="currentIndex"
                class="rounded-xl p-4 flex flex-col gap-3"
                style="border: 2px solid var(--focus-ring); background: var(--item-bg);"
              >
                <!-- Store name + status -->
                <div class="flex items-start justify-between gap-2">
                  <div class="flex items-center gap-2">
                    <div
                      class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style="background: var(--focus-ring);"
                    >
                      <Store class="w-4 h-4" style="color: #fff;" />
                    </div>
                    <div>
                      <div class="text-sm font-bold" style="color: var(--text-main);">
                        {{ current.pos_profile.posa_store_name || current.pos_profile.name }}
                      </div>
                      <div class="text-xs" style="color: var(--text-muted);">
                        {{ current.pos_profile.name }} · {{ current.pos_opening_shift.company }}
                      </div>
                    </div>
                  </div>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
                    style="background: var(--icon-bg-green); color: var(--icon-color-green);"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" style="background: var(--icon-color-green);" />
                    Open
                  </span>
                </div>

                <!-- Info grid -->
                <div class="grid grid-cols-2 gap-2">
                  <div
                    class="rounded-lg px-3 py-2"
                    style="background: var(--card-bg); border: 1px solid var(--card-border);"
                  >
                    <div class="text-xs mb-0.5" style="color: var(--text-muted);">Shift ID</div>
                    <div class="text-xs font-mono font-semibold truncate" style="color: var(--text-sub);">
                      {{ current.pos_opening_shift.name }}
                    </div>
                  </div>
                  <div
                    class="rounded-lg px-3 py-2"
                    style="background: var(--card-bg); border: 1px solid var(--card-border);"
                  >
                    <div class="text-xs mb-0.5" style="color: var(--text-muted);">Started</div>
                    <div class="text-xs font-semibold" style="color: var(--text-sub);">
                      {{ formatDate(current.pos_opening_shift.period_start_date) }}
                    </div>
                  </div>
                  <div
                    class="rounded-lg px-3 py-2"
                    style="background: var(--card-bg); border: 1px solid var(--card-border);"
                  >
                    <div class="text-xs mb-0.5" style="color: var(--text-muted);">Opening Balance</div>
                    <div class="text-xs font-semibold font-mono" style="color: var(--text-sub);">
                      {{ formatCurrency(openingBalance(current), current.pos_profile.currency) }}
                    </div>
                  </div>
                  <div
                    class="rounded-lg px-3 py-2"
                    style="background: var(--card-bg); border: 1px solid var(--card-border);"
                  >
                    <div class="text-xs mb-0.5" style="color: var(--text-muted);">Payment Methods</div>
                    <div class="text-xs font-semibold truncate" style="color: var(--text-sub);">
                      {{ paymentMethods(current) }}
                    </div>
                  </div>
                </div>

                <!-- Dots -->
                <div v-if="shifts.length > 1" class="flex items-center justify-center gap-1.5">
                  <button
                    v-for="(_, i) in shifts"
                    :key="i"
                    class="rounded-full transition-all"
                    :style="i === currentIndex
                      ? { width: '20px', height: '6px', background: 'var(--focus-ring)' }
                      : { width: '6px', height: '6px', background: 'var(--card-border)' }"
                    @click="goTo(i)"
                  />
                </div>

              </div>
            </Transition>
          </div>

          <!-- Right Arrow -->
          <button
            class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
            :style="currentIndex === shifts.length - 1
              ? { background: 'var(--item-bg)', color: 'var(--text-muted)', opacity: '0.35', cursor: 'not-allowed' }
              : { background: 'var(--item-bg)', color: 'var(--text-sub)', border: '1px solid var(--card-border)', cursor: 'pointer' }"
            :disabled="currentIndex === shifts.length - 1"
            @click="next"
          >
            <ChevronRight class="w-5 h-5" />
          </button>

        </div>

        <!-- Footer -->
        <div
          class="px-4 py-3 flex items-center justify-between gap-3 flex-shrink-0"
          style="border-top: 1px solid var(--card-border); background: var(--item-bg);"
        >
          <button
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors"
            style="color: var(--text-sub); background: var(--card-bg); border: 1px solid var(--card-border);"
            @mouseover="$event.currentTarget.style.background = 'var(--nav-item-hover-bg)'"
            @mouseleave="$event.currentTarget.style.background = 'var(--card-bg)'"
            @click="$emit('open-new')"
          >
            <Plus class="w-3.5 h-3.5" />
            Open New Shift
          </button>

          <button
            class="flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold"
            style="background: var(--focus-ring); color: #fff;"
            @click="confirm"
          >
            <CheckCircle class="w-3.5 h-3.5" />
            Continue
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Monitor, Store, X, Plus, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  shifts: { type: Array, default: () => [] },
})

const emit = defineEmits(['select', 'open-new', 'close'])

// ─── Carousel state ──────────────────────────────────────
const currentIndex = ref(0)
const direction    = ref('next')

const current = computed(() => props.shifts[currentIndex.value])

const prev = () => {
  if (currentIndex.value === 0) return
  direction.value = 'prev'
  currentIndex.value--
}

const next = () => {
  if (currentIndex.value === props.shifts.length - 1) return
  direction.value = 'next'
  currentIndex.value++
}

const goTo = (i) => {
  direction.value    = i > currentIndex.value ? 'next' : 'prev'
  currentIndex.value = i
}

// ─── Helpers ─────────────────────────────────────────────
const openingBalance = (shift) =>
  (shift.pos_opening_shift.balance_details || [])
    .reduce((sum, b) => sum + (b.amount || 0), 0)

const paymentMethods = (shift) =>
  (shift.pos_opening_shift.balance_details || [])
    .map(b => b.mode_of_payment)
    .join(', ') || '—'

const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false,
  })
}

const formatCurrency = (amount, currency = 'SAR') =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: currency || 'SAR',
    minimumFractionDigits: 2,
  }).format(amount)

// ─── Confirm ─────────────────────────────────────────────
const confirm = () => emit('select', current.value)
</script>

<style scoped>
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.2s ease;
}

.slide-left-enter-from  { opacity: 0; transform: translateX(30px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-30px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(30px); }
</style>
