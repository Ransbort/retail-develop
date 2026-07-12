import Dexie from 'dexie'

export const db = new Dexie('retail_pos')
db.version(1).stores({
  invoice_queue: '++id, offline_id, timestamp, synced, mode',
  stock: '&[item_code+warehouse], item_code, warehouse',
  items: '&item_code, item_name, item_group',
  customers: '&name, customer_name, mobile_no',
  translations: '&locale',
})
