<template>
  <div class="flex justify-between items-start gap-4">
    <span
      class="text-sm font-medium truncate"
      :style="{ color: 'var(--text-sub)' }"
    >
      {{ label }}
    </span>
    <span
      class="font-semibold text-right truncate"
      :style="{ color: 'var(--text-main)' }"
    >
      {{ value || '-' }}
    </span>
  </div>
</template>

<script setup>
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '-' },
})
</script>

<style scoped>
/* Ellipsis for long text */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
