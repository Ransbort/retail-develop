
<!-- components/FormField.vue -->
<template>
  <div class="space-y-2">
    <label v-if="label" :for="fieldId" class="block text-gray-700 font-semibold">
      {{ label }}
      <span v-if="required" class="text-red-600">*</span>
    </label>
    <slot />
    <p v-if="help" class="text-gray-500 text-sm">{{ help }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  required: Boolean,
  help: String
})
</script>
