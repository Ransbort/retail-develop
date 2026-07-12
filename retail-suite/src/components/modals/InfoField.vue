<!-- src/components/modals/InfoField.vue -->
<template>
  <div class="info-field-container">
    <!-- Label with optional icon -->
    <div class="label-wrapper">
      <label class="field-label">
        <span v-if="icon" class="label-icon">{{ icon }}</span>
        {{ label }}
      </label>
      <span v-if="required" class="required-indicator">*</span>
    </div>

    <!-- Value display with different states -->
    <div v-if="loading" class="field-value loading-state">
      <div class="skeleton-loader"></div>
    </div>
    <div v-else-if="!value && !isEmpty" class="field-value empty-state">
      <span class="empty-text">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        No data available
      </span>
    </div>
    <div v-else class="field-value">
      <p class="value-text">{{ value }}</p>
      <div v-if="showCopyButton" class="copy-action">
        <button
          @click="copyToClipboard"
          :class="['copy-btn', { 'copied': isCopied }]"
          :title="isCopied ? 'Copied!' : 'Copy to clipboard'"
        >
          <svg v-if="!isCopied" class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <svg v-else class="copy-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Optional tooltip -->
    <div v-if="tooltip" class="tooltip-wrapper">
      <p class="tooltip-text">{{ tooltip }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    default: null
  },
  icon: {
    type: String,
    default: null
  },
  tooltip: {
    type: String,
    default: null
  },
  required: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  showCopyButton: {
    type: Boolean,
    default: false
  },
  isEmpty: {
    type: Boolean,
    default: false
  }
})

const isCopied = ref(false)

const copyToClipboard = () => {
  const text = this.value?.toString() || ''
  navigator.clipboard.writeText(text)
  isCopied.value = true
  setTimeout(() => {
    isCopied.value = false
  }, 2000)
}


</script>

<style scoped>
.info-field-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #f8fafb 0%, #ffffff 100%);
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.info-field-container::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.info-field-container:hover {
  border-color: #d1d5db;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
}

.info-field-container:hover::before {
  opacity: 1;
}

/* Label Styling */
.label-wrapper {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.field-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-transform: capitalize;
}

.label-icon {
  font-size: 1rem;
  display: inline-flex;
  align-items: center;
}

.required-indicator {
  color: #ef4444;
  font-weight: bold;
  font-size: 1.125rem;
}

/* Value Styling */
.field-value {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 0;
  min-height: 2rem;
}

.value-text {
  color: #1f2937;
  font-weight: 500;
  font-size: 1rem;
  line-height: 1.5;
  margin: 0;
  word-break: break-word;
  flex: 1;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem !important;
  background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
  border-radius: 0.5rem;
  border: 1px dashed #fcd34d;
}

.empty-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #92400e;
  font-size: 0.875rem;
  font-weight: 500;
}

.empty-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.7;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.skeleton-loader {
  width: 100%;
  height: 1.5rem;
  background: linear-gradient(
    90deg,
    #e5e7eb 0%,
    #f3f4f6 50%,
    #e5e7eb 100%
  );
  background-size: 200% 100%;
  border-radius: 0.375rem;
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Copy Button */
.copy-action {
  display: flex;
  align-items: center;
  margin-left: 0.5rem;
}

.copy-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  opacity: 0;
  transform: scale(0.9);
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.field-value:hover .copy-btn {
  opacity: 1;
  transform: scale(1);
}

.copy-btn:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transform: scale(1.05);
}

.copy-btn:active {
  transform: scale(0.95);
}

.copy-btn.copied {
  opacity: 1;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);
}

.copy-icon {
  width: 1rem;
  height: 1rem;
  stroke-width: 2;
}

/* Tooltip */
.tooltip-wrapper {
  margin-top: 0.25rem;
}

.tooltip-text {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  margin: 0;
  padding: 0.5rem;
  background: #f3f4f6;
  border-left: 2px solid #3b82f6;
  border-radius: 0.25rem;
  line-height: 1.4;
}

/* Responsive Design */
@media (max-width: 640px) {
  .info-field-container {
    padding: 0.75rem;
  }

  .field-label {
    font-size: 0.8125rem;
  }

  .value-text {
    font-size: 0.9375rem;
  }

  .copy-btn {
    width: 1.75rem;
    height: 1.75rem;
  }

  .copy-icon {
    width: 0.875rem;
    height: 0.875rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .info-field-container {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border-color: #374151;
  }

  .info-field-container:hover {
    border-color: #4b5563;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .field-label {
    color: #e5e7eb;
  }

  .value-text {
    color: #f3f4f6;
  }

  .empty-state {
    background: linear-gradient(135deg, #78350f 0%, #451a03 100%);
    border-color: #92400e;
  }

  .empty-text {
    color: #fcd34d;
  }

  .skeleton-loader {
    background: linear-gradient(
      90deg,
      #374151 0%,
      #4b5563 50%,
      #374151 100%
    );
  }

  .tooltip-text {
    color: #d1d5db;
    background: #374151;
    border-left-color: #60a5fa;
  }
}
</style>
