import { ref, watch } from 'vue'
import { session, api } from './auth.js'

// ==========================================
// QRBotManager - Simple Polling Version
// ==========================================
class QRBotManager {
  constructor(config = {}) {
    this.listeners = new Map()
    this.isConnected = ref(false)
    this.lastBarcode = null
    this.pollingInterval = config.pollingInterval || 1000 // every 1 second
    this.pollingTimer = null
    this.enabled = ref(true)
  }

  // ==========================================
  // Start polling for barcodes
  // ==========================================
  async start() {
    if (!session.isAuthenticated) {
      console.warn('⏳ Waiting for authentication...')
      await this.waitForAuth()
    }

    console.log('🚀 Starting QRBot Polling...')
    this.isConnected.value = true
    this.emit('connected')

  }

  waitForAuth() {
    return new Promise((resolve) => {
      if (session.isAuthenticated) {
        resolve()
        return
      }

      console.log('⏳ Waiting for session authentication...')
      const unwatch = watch(
        () => session.isAuthenticated,
        (isAuth) => {
          if (isAuth) {
            console.log('✅ Session authenticated')
            unwatch()
            resolve()
          }
        }
      )

      // Timeout بعد 15 ثانية
      setTimeout(() => {
        unwatch()
        resolve()
      }, 15000)
    })
  }

  // ==========================================
  // Register event listener
  // ==========================================
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  // ==========================================
  // Remove event listener
  // ==========================================
  off(event, callback) {
    if (this.listeners.has(event)) {
      const arr = this.listeners.get(event)
      const index = arr.indexOf(callback)
      if (index > -1) arr.splice(index, 1)
    }
  }

  // ==========================================
  // Emit event
  // ==========================================
  emit(event, data = null) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => {
        try {
          cb(data)
        } catch (err) {
          console.error(`❌ Error in callback for ${event}:`, err)
        }
      })
    }
  }

  // ==========================================
  // Stop polling
  // ==========================================
  stop() {
    if (this.pollingTimer) {
      clearTimeout(this.pollingTimer)
      this.pollingTimer = null
    }
    this.enabled.value = false
    this.isConnected.value = false
    console.log('🛑 QRBot Polling stopped')
    this.emit('disconnected')
  }

  // ==========================================
  // Set polling interval
  // ==========================================
  setPollingInterval(ms) {
    this.pollingInterval = ms
    console.log(`⏱️ Polling interval set to ${ms}ms`)
  }
}

// ==========================================
// Global instance
// ==========================================
const qrBot = new QRBotManager()

// ==========================================
// Auto-start after auth
// ==========================================
async function initQRBot() {
  try {
    console.log('🚀 Initializing QRBot Polling...')
    await qrBot.start()
    console.log('✅ QRBot Polling started successfully')
  } catch (err) {
    console.error('❌ QRBot initialization failed:', err.message)
    setTimeout(initQRBot, 3000)
  }
}

// Start on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initQRBot)
} else {
  setTimeout(initQRBot, 100)
}

export default qrBot
export { QRBotManager, initQRBot }
