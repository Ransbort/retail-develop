<!-- Sidebar.vue -->

<template>
 <aside
      :class="isDark ? 'theme-dark' : 'theme-light'"
      class="sticky max-h-screen top-0 side-container flex flex-row w-auto flex-shrink-0 z-40"
    >
    <div
      class="flex flex-col items-center py-3 flex-shrink-0 w-16 rounded-3xl transition-colors duration-300"
      
    >
      <!-- Application Logo -->
      <router-link
        to="/pos"
        class="flex items-center justify-center h-10 w-10 rounded-full transition-all duration-200 hover:scale-110"
        :style="{
          backgroundColor: lightenColor(primaryColor, 40),
          color: primaryColor,
          transition: 'all 0.3s ease'
        }"
      >
        <AppLogo />
      </router-link>

      <!-- Navigation Menu -->
      <ul class="flex flex-col space-y-1 mt-4 gap-4 box-shadow: var(--content-panel-shadow)">
        <!-- POS Icon Menu Item -->
        <li>
          <router-link
            to="/pos"
            v-slot="{ isActive }"
            class="flex items-center"
            @click.prevent="handleMenuClick('pos')"
          >
            <span
              class="flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-200"
              :class="getMenuClass('pos', isActive)"
              :style="getMenuStyle('pos', isActive)"
              title="Point of Sale"
            >
              <PosIcon />
            </span>
          </router-link>
        </li>

        <!-- Payment Menu Item -->
        <li>
          <router-link
            to="/payment"
            class="flex items-center"
            #default="{ isActive }"
          >
            <span
              class="flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-200"
              :class="getMenuClass('/payment', isActive)"
              :style="getMenuStyle('/payment', isActive)"
              title="payment"
            >
              <CashIcon />
            </span>
          </router-link>
        </li>

        <!-- Inventory Icon -->
        <li>
          <a
            href="#"
            class="flex items-center"
            @click.prevent="handleMenuClick('barcodesunified')"
          >
            <span
              class="flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-200"
              :class="getMenuClass('barcodesunified', isActive)"
              :style="getMenuStyle('barcodesunified', isActive)"
              title="Barcodes Unified"
            >
              <InventoryIcon />
            </span>
          </a>
        </li>

        <!-- ShiftShowDialog Menu Item -->
        <li>
          <router-link
            to="#"
            class="flex items-center"
            @click.prevent="handleMenuClick('dialog')"
          >
            <span
              class="flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-200"
              :class="getMenuClass('dialog', isActive)"
              :style="getMenuStyle('dialog', isActive)"
              title="Current Shift"
          >
          <Clock />
        </span>
        </router-link>
        </li>

        <!-- Invoices Item (drafts, returns) -->
        <li>
           <router-link
            to="#"
            class="flex items-center"
            @click.prevent="handleMenuClick('invoices')"
          >
            <span
              class="flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-200"
              :class="getMenuClass('invoices', isActive)"
              :style="getMenuStyle('invoices', isActive)"
              title="Invoices"
            >
            <FileText class="w-5 h-5" />
            </span>
          </router-link>
        </li>

        <!-- Settings Menu Item -->
        <li>
          <router-link
            to="#"
            class="flex items-center"
            @click.prevent="handleMenuClick('settings')"
          >
            <span
              class="flex items-center justify-center h-10 w-10 rounded-2xl transition-all duration-200"
              :class="getMenuClass('/settings', isActive)"
              :style="getMenuStyle('/settings', isActive)"
              title="System Settings"
            >
              <SettingsIcon />
            </span>
          </router-link>
        </li>
      </ul>

      <!-- Back to Site Link -->
      <a
        :href="siteUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="mt-auto flex items-center justify-center h-10 w-10 focus:outline-none transition-colors duration-200"
        :style="{
          color: lightenColor(primaryColor, 30),
          transition: 'color 0.3s ease'
        }"
        title="Back to site"
      >
        <CircleArrowLeft />
      </a>
    </div>
  </aside>
</template>
<script setup>
import { useSettingsStore } from '@/stores/settings'
import { computed, onMounted, onUnmounted, watch } from 'vue'
import PosIcon from '@/components/icons/PosIcon.svg'
import InventoryIcon from '@/components/icons/InventoryIcon.svg'
import CashIcon from '@/components/icons/DollarIcon.svg'
import SettingsIcon from '@/components/icons/SettingsIcon.svg'
import ReturnIcon from '@/components/icons/ReturnIcon.svg'
import CircleArrowLeft from '@/components/icons/CircleArrowLeft.svg'
import AppLogo from '@/components/icons/AppLogo.svg'
import {FileText,Clock} from 'lucide-vue-next'


const props = defineProps( {
  activeMenu: {
    type: String,
    default: 'pos'
  }
})
const emit = defineEmits( ['menu-change'])

const settingsStore = useSettingsStore()

const settings = computed(() => settingsStore.settings)

const primaryColor = computed(() => {
  return settings.value?.appearance?.primaryColor || '#06b6d4'
})

const theme = computed(() => {
  return settings.value?.appearance?.theme || 'light'
})

const isDark    = computed(() => settings.value?.appearance?.theme !== 'light')

// Dynamic href: points back to whatever domain/origin the app is currently served from
const siteUrl = computed(() => {
  return typeof window !== 'undefined' ? window.location.origin : ''
})

const applyTheme = () => {
  try {
    const color = primaryColor.value
    const themeValue = theme.value

    document.documentElement.style.setProperty('--primary-color', color)
    document.documentElement.setAttribute('data-theme', themeValue)
  } catch (error) {
    console.error('❌ Error applying theme:', error)
  }
}


onMounted(() => {
  applyTheme()
  watch(
    () => primaryColor.value,
    (newColor) => {
      applyTheme()
    }
  )
  watch(
    () => theme.value,
    (newTheme) => {
      console.log('🌙 Theme changed:', newTheme)
      applyTheme()
    }
  )
})

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : null
}

const lightenColor = (hex, percent) => {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex

  const factor = 1 + percent / 100
  const r = Math.min(255, Math.round(rgb.r * factor))
  const g = Math.min(255, Math.round(rgb.g * factor))
  const b = Math.min(255, Math.round(rgb.b * factor))

  return `rgb(${r}, ${g}, ${b})`
}

const getMenuClass = (menuItem, isActive = false) => {
  const isActive_ = props.activeMenu === menuItem || isActive
  if (isActive_) {
    return 'shadow-lg text-white'
  }
  return 'text-opacity-70 hover:text-opacity-100'
}

const getMenuStyle = (menuItem, isActive = false) => {
  const isActive_ = props.activeMenu === menuItem || isActive
  const currentColor = primaryColor.value

  if (isActive_) {
    return {
      backgroundColor: lightenColor(currentColor, 20),
      transition: 'all 0.2s ease'
    }
  }
  return {
    backgroundColor: lightenColor(currentColor, -10),
    color: 'rgba(255, 255, 255, 0.7)',
    transition: 'all 0.2s ease'
  }
}

const handleMenuClick = (menuItem) => {
  console.log('📍 Menu clicked:', menuItem)
  emit('menu-change', menuItem)
}

</script>

<style scoped>
/* Smooth transitions */
a, span, div {
  transition: all 0.2s ease-in-out;
}

/* Focus states */
a:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.5);
  border-radius: 1rem;
}

/* Active menu item pulse effect */
.shadow-lg {
  animation: pulse-shadow 2s infinite;
}

@keyframes pulse-shadow {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(103, 232, 249, 0.4);
  }
  50% {
    box-shadow: 0 0 0 6px rgba(103, 232, 249, 0);
  }
}
</style>
