<template>
  <Teleport to="body">
    <div class="fixed bottom-4 right-4 z-[99999] flex flex-col gap-2 items-end pointer-events-none">
      <TransitionGroup name="toast-slide">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-[10px] shadow-lg min-w-[260px] max-w-[360px]"
          :class="typeClasses[t.type] || typeClasses.success"
        >
          <!-- Icon -->
          <component
            :is="iconMap[t.icon] || iconMap.check"
            class="w-4 h-4 shrink-0 mt-0.5"
            :class="t.iconClasses || defaultIconClass[t.type]"
          />

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-semibold leading-snug" :class="textClass[t.type]">
              {{ t.title }}
            </p>
            <p v-if="t.message" class="text-[11px] mt-0.5 opacity-70" :class="textClass[t.type]">
              {{ t.message }}
            </p>
          </div>

          <!-- Close -->
          <button
            class="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
            :class="textClass[t.type]"
            @click="remove(t.id)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
import { X, Check, AlertTriangle, Info, XCircle } from 'lucide-vue-next'

const { toasts, remove } = useToast()

const iconMap = {
  check:           Check,
  x:               XCircle,
  'alert-triangle': AlertTriangle,
  info:            Info,
}

const typeClasses = {
  success: 'bg-green-50  border border-green-200',
  error:   'bg-red-50    border border-red-200',
  warning: 'bg-yellow-50 border border-yellow-200',
  info:    'bg-blue-50   border border-blue-200',
}

const textClass = {
  success: 'text-green-800',
  error:   'text-red-800',
  warning: 'text-yellow-800',
  info:    'text-blue-800',
}

const defaultIconClass = {
  success: 'text-green-500',
  error:   'text-red-500',
  warning: 'text-yellow-500',
  info:    'text-blue-500',
}
</script>

<style scoped>
.toast-slide-enter-active { transition: all .25s cubic-bezier(.34,1.56,.64,1); }
.toast-slide-leave-active { transition: all .18s ease-in; }
.toast-slide-enter-from   { opacity: 0; transform: translateX(20px) scale(.96); }
.toast-slide-leave-to     { opacity: 0; transform: translateX(20px); }
.toast-slide-move         { transition: transform .2s ease; }
</style>
