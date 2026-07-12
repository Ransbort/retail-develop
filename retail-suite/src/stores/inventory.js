import { defineStore } from 'pinia'
import { ref, computed, watch, toRaw } from 'vue'
import { call, createListResource } from 'frappe-ui'
import { useShiftStore } from '@/stores/shift'
export const useInventoryStore = defineStore('inventory', () => {
    // State
    const items = ref([])
    const uoms = ref([])

    const categories = ref([])
    const transfers = ref([])
    const loading = ref(false)
    const error = ref(null)

    // stores
    const shiftStore = useShiftStore()
    const pos_profile = computed(() => shiftStore.pos_profile || {})
    const pos_profile_name = computed(() => shiftStore.pos_profile?.name || '')

    const loadUOM = async ()=>{
        loading.value = true
        error.value = null
        try {
            const resource = createListResource({
                doctype: 'UOM',
                fields: JSON.stringify(['*']),
                auto: true,
                limit_page_length: 100,
            })
            resource.fetch()
            await resource.list.promise
            console.log("API Get UOMs: ", resource.data)
            uoms.value = resource.data || []
            return resource.data || []
        } catch (err) {
            console.error('Error loading items:', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    const defaultItemSeries = async()=>{
        const response = await call('retail.retail.api.inventory.get_default_item_series')
        console.log('series response',response)
        return response
    }
    const loadCategories = async ()=>{
          loading.value = true
          error.value = null
        try {

            const resource = createListResource({
                doctype: 'Item Group',
                fields: JSON.stringify(['name']),
                auto: true,
                limit_page_length: 100,
            })
            resource.fetch()
            await resource.list.promise
            console.log("API Get Categories: ", resource.data)
            categories.value = resource.data || []
            return resource.data || []
        } catch (err) {
            console.error('Error loading categories:', err)
            throw err
        } finally {
            loading.value = false
        }
    }
    const addItem = async (itemData) => {
        try {
            const response = await call('retail.retail.api.inventory.add_item', {
                item_data:itemData})
            console.log('ADD Item API',response)
            return response
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const updateItem = async (itemId, itemData) => {
        try {
            console.log("itemData",itemData)
            const response = await call("retail.retail.api.inventory.update_item",  {
                "item_code": itemId,
                "item_data": itemData
            })

            const updatedItem = response.data
            console.log("updated +Item+",response)
            console.log("updated +Item+ itemId",response.data.item_code)
            console.log("updated itemId ", itemId)
            console.log("updated itemData ", itemData)
            const index = items.value.findIndex(
            i => i.item_code === response.data.item_code || i.name === response.data.name
            )

            if (index !== -1 && updatedItem) {
            items.value[index] = {
                ...items.value[index],
                ...updatedItem
            }
            }
            console.log("Items after Update ", items)
             return updatedItem

        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    const deleteItem = async (itemId) => {
        try {
            console.log("item you ean't to delete is", itemId)
           const response = await call("retail.retail.api.inventory.delete_item", {
                item_code: itemId
            });
            console.log("deleteItem response",response)
            return response
        } catch (err) {
            error.value = err.message
            throw err
        }
    }

    return {
        // State
        items,
        uoms,
        categories,
        loading,
        error,
        pos_profile,

        // Actions
        loadUOM,
        loadCategories,
        addItem,
        updateItem,
        deleteItem,
        defaultItemSeries
    }
})
