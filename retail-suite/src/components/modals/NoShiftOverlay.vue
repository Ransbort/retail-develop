<template>
  <div
    class="fixed inset-0 flex items-center justify-center z-40"
    :style="{ background: 'rgba(0,0,0,0.5)' }"
  >
    <div
      class="rounded-lg shadow-xl max-w-md w-full mx-4 p-6 text-center"
      :style="{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }"
    >
      <!-- Warning Icon -->
      <div
        class="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
        :style="{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }"
      >
        <svg
          class="w-8 h-8"
          :style="{ color: 'var(--warning-border)' }"
          viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        >
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      </div>

      <!-- Message -->
      <p class="text-sm mb-1" :style="{ color: 'var(--text-main)' }">
        No active shift
      </p>
      <p class="text-xs" :style="{ color: 'var(--text-muted)' }">
        Please open a shift before starting sales transactions.
      </p>

    <!-- Button -->
    <div class="flex justify-center space-x-4 mt-6">
        <div class="flex items-center justify-center">
            <button
            @click="$emit('open')"
            :style="{ color: hover ? primaryColor : 'var(--text-muted)' }"
            @mouseover="hover = true"
            @mouseleave="hover = false"
            class="w-8 h-8 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110"
            >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
                stroke-width="2.5" stroke-linecap="round">
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
            </button>
        </div>
    </div>

      <p class="text-xs mt-2" :style="{ color: 'var(--text-muted)' }">
        Click to open shift
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const hover = ref(false)

const props = defineProps({
  primaryColor: { type: String, default: '#06b6d4' }
})

defineEmits(['open'])
</script>
