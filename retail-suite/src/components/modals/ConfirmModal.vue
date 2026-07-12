<template>
  <Teleport to="body">
    <div
      v-if="state.show"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @mousedown.self="handleCancel"
    >
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden confirm-modal">

        <div class="px-6 pt-6 pb-4 text-center">
          <div :class="iconBg" class="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
            <component :is="iconComponent" class="w-7 h-7" :class="iconColor" />
          </div>
          <h3 class="text-base font-bold text-gray-900 mb-1">{{ state.title }}</h3>
          <p class="text-sm text-gray-500 leading-relaxed">{{ state.message }}</p>
          <div v-if="state.docName" class="mt-3 inline-flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg">
            <span class="text-xs font-bold text-gray-900 font-mono">{{ state.docName }}</span>
          </div>
        </div>

        <div v-if="state.type === 'cancel' || state.type === 'delete'" class="mx-6 mb-4 flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
          <AlertTriangle class="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
          <p class="text-xs text-red-600">This action cannot be undone.</p>
        </div>

        <div class="px-6 pb-6 flex gap-3">
          <button
            @click="handleCancel"
            :disabled="state.loading"
            class="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            @click="handleConfirm"
            :disabled="state.loading"
            :class="confirmBtnClass"
            class="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Loader2 v-if="state.loading" class="w-4 h-4 animate-spin" />
            <component v-else :is="iconComponent" class="w-4 h-4" />
            {{ state.loading ? 'Processing...' : state.confirmLabel }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { CheckCircle, XCircle, AlertTriangle, Loader2, Trash2, Info } from 'lucide-vue-next'
import { useConfirmState } from '@/composables/useConfirm'

const state = useConfirmState()

const typeConfig = {
  submit: { iconBg: 'bg-green-100', iconColor: 'text-green-600', icon: CheckCircle, btn: 'bg-green-600 hover:bg-green-700' },
  cancel: { iconBg: 'bg-red-100',   iconColor: 'text-red-600',   icon: XCircle,    btn: 'bg-red-600 hover:bg-red-700' },
  delete: { iconBg: 'bg-red-100',   iconColor: 'text-red-600',   icon: Trash2,     btn: 'bg-red-600 hover:bg-red-700' },
  warning:{ iconBg: 'bg-amber-100', iconColor: 'text-amber-600', icon: AlertTriangle, btn: 'bg-amber-600 hover:bg-amber-700' },
  info:   { iconBg: 'bg-blue-100',  iconColor: 'text-blue-600',  icon: Info,       btn: 'bg-blue-600 hover:bg-blue-700' },
}

const current       = computed(() => typeConfig[state.value.type] || typeConfig.info)
const iconBg        = computed(() => current.value.iconBg)
const iconColor     = computed(() => current.value.iconColor)
const iconComponent = computed(() => current.value.icon)
const confirmBtnClass = computed(() => current.value.btn)

function handleConfirm() {
  state.value.resolve?.(true)
  state.value.show = false
}
function handleCancel() {
  state.value.resolve?.(false)
  state.value.show = false
}
</script>

<style scoped>
.confirm-modal {
  animation: pop-in 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes pop-in {
  from { opacity: 0; transform: scale(0.92) translateY(8px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
