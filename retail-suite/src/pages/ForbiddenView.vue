<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="text-center max-w-md">
      <h1 class="text-4xl font-bold text-red-600 mb-4">403</h1>
      <p class="text-gray-700 mb-6">
        {{ dynamicMessage }}
      </p>
      <router-link
        to="/pos"
        class="px-4 py-2 bg-black text-white rounded-lg"
      >
        Go Back Home
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'

const route = useRoute()

const dynamicMessage =
  route.query.message || 'You are not allowed to access this resource.'
</script>
