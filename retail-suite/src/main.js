// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

import './index.css'
import './main.css'

// plugins (keep but optimize)
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Vuetify (keep but optimized import style)
import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// router
import router from './router.js'

// frappe-ui
import {
  frappeRequest,
  setConfig,
} from 'frappe-ui'

// socket (lazy init)
import { initSocket } from "./socket"

import '@/db/network'

// i18n translations
import i18nPlugin from '@/i18n'

/* ─────────────────────────────────────────────
   CORE APP SETUP
───────────────────────────────────────────── */

const pinia = createPinia()

const vuetify = createVuetify({
  components,
  directives,
})

const app = createApp(App)

/* ─────────────────────────────────────────────
   CONFIG
───────────────────────────────────────────── */

setConfig('resourceFetcher', frappeRequest)

/* ─────────────────────────────────────────────
   PLUGINS
───────────────────────────────────────────── */

app.use(router)
app.use(pinia)
app.use(Toast)
app.use(vuetify)
app.use(i18nPlugin)
/* ─────────────────────────────────────────────
   GLOBAL TOAST (safe init)
───────────────────────────────────────────── */

// delay toast init to avoid early hydration cost
setTimeout(async () => {
  const { useToast } = await import('vue-toastification')
  window.$toast = useToast()
}, 0)

/* ─────────────────────────────────────────────
   SOCKET (lazy + non-blocking)
───────────────────────────────────────────── */

function initializeSocketLazy() {
  requestIdleCallback(() => {
    try {
      const siteName =
        import.meta.env.VITE_SITE_NAME ||
        window.location.hostname

      if (!window.frappe) window.frappe = {}

      const socket = initSocket(siteName)

      // connect after idle (important)
      setTimeout(() => {
        socket.connect()
      }, 0)

      window.frappe.realtime = socket

    } catch (err) {
      console.warn("[socket] init failed:", err)
    }
  })
}

initializeSocketLazy()

/* ─────────────────────────────────────────────
   MOUNT APP
───────────────────────────────────────────── */

app.mount('#app')
