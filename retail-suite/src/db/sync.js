// src/db/sync.js
import { db } from './indexedDB'
import { loadLocale } from '@/i18n'
import { toRaw } from 'vue'
const OFFLINE_ID_PREFIX = 'retail_offline_'

// ============================================================================
// HELPERS
// ============================================================================

export const generateOfflineId = () =>
  `${OFFLINE_ID_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

/**
 * حفظ فاتورة في الـ queue
 * mode: 'fast' | 'normal'
 */
export const saveToQueue = async (invoiceData, mode = 'fast') => {
  const offlineId = generateOfflineId()

  await db.invoice_queue.add({
    offline_id: offlineId,
    data: toRaw(invoiceData),
    mode,
    timestamp: Date.now(),
    synced: false,
    retry_count: 0,
  })

  // تحديث الكمية المحلية
  await updateLocalStock(invoiceData.items)

  return offlineId
}

/**
 * جيب كل الفواتير اللي لسه اتسنكتش
 */
export const getPendingInvoices = async () => {
  return await db.invoice_queue
    .filter(inv => !inv.synced)
    .toArray()
}

// ============================================================================
// STOCK OPERATIONS
// ============================================================================

/**
 * تحديث الكمية المحلية بعد فاتورة offline
 */
export const updateLocalStock = async (items = []) => {
  for (const item of items) {
    if (!item.item_code || !item.warehouse) continue

    let current = null
    try {
      current = await db.stock.get({ item_code: item.item_code, warehouse: item.warehouse })
    } catch (_) {}

    const newQty = (current?.qty || 0) - (item.qty || 0)

    await db.stock.put({
      item_code: item.item_code,
      warehouse: item.warehouse,
      qty: newQty,
      updated_at: Date.now(),
    })
  }
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Sync invoices from queue to server
 */
export const syncPendingInvoices = async (addTransaction, saveInvoice) => {
  const pending = await getPendingInvoices()
  if (!pending.length) return { success: 0, failed: 0 }

  const result = { success: 0, failed: 0 }

  for (const inv of pending) {
    try {
      if (inv.mode === 'fast') {
        await addTransaction(inv.data)
      } else {
        await saveInvoice(inv.data)
      }

      await db.invoice_queue.update(inv.id, { synced: true })
      result.success++
    } catch (error) {
      await db.invoice_queue.update(inv.id, {
        retry_count: (inv.retry_count || 0) + 1,
        last_error: error.message,
      })
      result.failed++
    }
  }

  return result
}


export const cacheOfflineData = async (pos_profile, getItems, getCustomers) => {
  try {
    if (!pos_profile) return
    console.log('📦 Caching offline data...')
    const [itemsResponse, customers, translationsResponse] = await Promise.all([
      getItems(
        pos_profile,
        pos_profile.selling_price_list,
        pos_profile.customer,
        '',
        null
      ),
      getCustomers(pos_profile),
      loadLocale(),
    ])


    if (itemsResponse.items?.length) {
      await db.items.bulkPut(itemsResponse.items)
      console.log(`✅ Cached ${itemsResponse.items.length} items`)
    }

    if (customers?.length) {
      await db.customers.bulkPut(customers)
      console.log(`✅ Cached ${customers.length} customers`)
    }

    console.log("translationsResponse:", translationsResponse)
    console.log("typeof translationsResponse:", typeof translationsResponse)
    console.log("translationsResponse.target:", translationsResponse.target)
    console.log("translationsResponse.messages:", translationsResponse.messages)
    console.log("translationsResponse.timestamp:", translationsResponse.timestamp)
    if (translationsResponse) {
        await db.translations.put({
            locale: translationsResponse.target,
            messages: translationsResponse.messages,
            timestamp: translationsResponse.timestamp,
        })
    }

  } catch (error) {
    console.error('❌ Error caching offline data:', error)
  }
}
