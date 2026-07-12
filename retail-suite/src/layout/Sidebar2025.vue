<template>
  <aside
    :class="[
      'fixed md:relative left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 z-40',
      isCollapsed ? 'w-20' : 'w-64'
    ]"
  >
    <!-- Sidebar Header -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-gray-700">
      <!-- Logo -->
      <div v-if="!isCollapsed" class="flex items-center gap-2">
        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
          IM
        </div>
        <div>
          <h1 class="text-lg font-bold">Inventory</h1>
          <p class="text-xs text-gray-400">Management</p>
        </div>
      </div>

      <!-- Collapsed Logo -->
      <div v-else class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center font-bold text-lg">
        IM
      </div>

      <!-- Toggle Button -->
      <button
        @click="$emit('toggle')"
        class="hidden md:flex p-2 hover:bg-gray-700 rounded-lg transition"
        title="Toggle Sidebar"
      >
        <svg
          :class="['w-5 h-5 transition-transform', isCollapsed ? 'rotate-180' : '']"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>

    <!-- Sidebar Content -->
    <nav class="flex-1 overflow-y-auto py-4 space-y-2">
      <!-- Main Section -->
      <div>
        <p v-if="!isCollapsed" class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Main
        </p>

        <!-- Dashboard -->
        <router-link
          to="/pos"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 16l4-4m0 0l4 4m-4-4v4m0-11l-4-2m0 0L3 9m9-4l4-2m0 0l4 2m-4-2v2m0 0L9 7" />
          </svg>
          <span v-if="!isCollapsed">Dashboard</span>
        </router-link>

        <!-- POS -->
        <router-link
          to="/pos"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/pos') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span v-if="!isCollapsed">POS</span>
        </router-link>
      </div>

      <!-- Inventory Section -->
      <div>
        <p v-if="!isCollapsed" class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
          Inventory
        </p>

        <!-- Inventory Dashboard -->
        <router-link
          to="/inventory"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/inventory') && !isActive('/inventory/') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10M7 12l8 4m0 0l8-4" />
          </svg>
          <span v-if="!isCollapsed">Dashboard</span>
        </router-link>

        <!-- Items -->
        <router-link
          to="/inventory/items"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/inventory/items') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m0 0l8 4m-8-4v10l8 4m0-10l8 4m-8-4v10M7 12l8 4m0 0l8-4" />
          </svg>
          <span v-if="!isCollapsed">Items</span>
        </router-link>

        <!-- Tracking -->
        <router-link
          to="/inventory/tracking"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/inventory/tracking') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <span v-if="!isCollapsed">Tracking</span>
        </router-link>

        <!-- Purchases -->
        <router-link
          to="/inventory/purchases"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/inventory/purchases') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span v-if="!isCollapsed">Purchases</span>
        </router-link>

        <!-- Transfers -->
        <router-link
          to="/inventory/transfers"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/inventory/transfers') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m0 0l4 4m10-4v12m0 0l4-4m0 0l-4-4" />
          </svg>
          <span v-if="!isCollapsed">Transfers</span>
        </router-link>
      </div>

      <!-- Reports Section -->
      <div>
        <p v-if="!isCollapsed" class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
          Reports
        </p>

        <!-- Archive -->
        <router-link
          to="/archive"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/archive') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
          <span v-if="!isCollapsed">Archive</span>
        </router-link>

        <!-- Invoices -->
        <router-link
          to="/invoices"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/invoices') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span v-if="!isCollapsed">Invoices</span>
        </router-link>
      </div>

      <!-- System Section -->
      <div class="mt-auto">
        <p v-if="!isCollapsed" class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mt-4">
          System
        </p>

        <!-- Settings -->
        <router-link
          to="/settings"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            isActive('/settings') ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span v-if="!isCollapsed">Settings</span>
        </router-link>

        <!-- Help -->
        <a
          href="#"
          :class="[
            'mx-2 px-4 py-3 rounded-lg transition flex items-center gap-3',
            'text-gray-300 hover:bg-gray-700'
          ]"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span v-if="!isCollapsed">Help</span>
        </a>
      </div>
    </nav>

    <!-- Sidebar Footer -->
    <div v-if="!isCollapsed" class="p-4 border-t border-gray-700">
      <div class="flex items-center gap-3 px-2 py-3 rounded-lg hover:bg-gray-700 transition cursor-pointer">
        <img
          src="https://ui-avatars.com/api/?name=User&background=0D8ABC&color=fff"
          alt="User"
          class="w-8 h-8 rounded-full"
        />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium truncate">User Name</p>
          <p class="text-xs text-gray-400 truncate">user@example.com</p>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router'

  const props = defineProps({
    isCollapsed: {
      type: Boolean,
      default: false
    }
  })
  const emit = defineEmits(['toggle'])

    const route = useRoute()

    const isActive = (path) => {
      return route.path.startsWith(path)
    }

</script>

<style scoped>
/* Smooth transitions */
aside {
  transition: width 0.3s ease;
}

/* Scrollbar styling */
nav::-webkit-scrollbar {
  width: 6px;
}

nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
