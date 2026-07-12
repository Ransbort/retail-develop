<!-- src/components/ToggleSwitch.vue -->
<template>
  <button
    @click="$emit('update:modelValue', !modelValue)"
    class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
    :class="{
      'bg-cyan-600': modelValue,
      'bg-gray-200': !modelValue
    }"
    dir="ltr"
  >
    <span
      class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200"
      :class="{
        'translate-x-6': modelValue,
        'translate-x-1': !modelValue
      }"
    />
  </button>
</template>

<script setup>
  const props = defineProps( {
    modelValue: {
      type: Boolean,
      default: false
    }
  })
  const emit = defineEmits(['update:modelValue'])
</script>
