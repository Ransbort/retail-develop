// src/db/network.js
import { ref, readonly } from 'vue'
import { syncPendingInvoices } from './sync'

const _isOffline = ref(!navigator.onLine)

// ============================================================================
// PUBLIC STATE
// ============================================================================

export const isOffline = readonly(_isOffline)

// ============================================================================
// LISTENERS
// ============================================================================

window.addEventListener('online', async () => {

  _isOffline.value = false

  const { useInvoicesStore } = await import('@/stores/invoices')
  const invoicesStore = useInvoicesStore()

  const result = await syncPendingInvoices(
    invoicesStore.addTransaction,
    invoicesStore.saveInvoice,
  )
  console.log('📋 Sync result:', result)
})

window.addEventListener('offline', () => {
  _isOffline.value = true
  console.log('📴 Network lost, switching to offline mode')
})
