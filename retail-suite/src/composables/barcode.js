import { call } from 'frappe-ui'
import {api} from '@/services/auth.js'
// ======================================================================
// Barcodes APIs
// ======================================================================
// Get Barcodes From Frappe DB
export const getBarcodesFromFrappeDB = async (items) => {
    try {
        console.log("Items params", items)
        const response = await call('retail.retail.api.inventory.get_all_barcodes',{items})
        console.log("api getBarcodesFromFrappeDB", response)
        return response || response.data
    }
    catch (error) {
        console.error("❌ getBarcodesFromFrappeDB error:", error)
    }
}

export const handleGenerateBarcodeFrappe = async (data) => {

    try {
        const response = await call('/api/resource/Barcode Item', {
            barcode: data.barcodeValue,
            barcode_type: data.type,
            parent: data.product_id,
            parenttype: 'Item',
            parentfield: 'barcodes',
        })
        console.log("api handleGenerateBarcode", response)
        return response || response.data
    }
    catch (error) {
        console.error("❌ handleGenerateBarcode error:", error)
    }
}
export const getBarcodeTypes = async () => {
    try {
        const response = await call(
            'retail.retail.api.inventory.get_barcode_types'
        )
        console.log("api getBarcodeTypes", response)
        return {
            status: 'success',
            data: response?.data || []
        }
    } catch (error) {
        console.error('Error fetching barcode types:', error)
        return { status: 'error', data: [] }
    }
}

export const updateItemBarcode = async (itemCode, oldBarcode, barcodeData) => {
    try {
        const response = await call(
            'retail.retail.api.inventory.update_item_barcode',
            {
                item_code:    itemCode,
                old_barcode:  oldBarcode,
                barcode_data: JSON.stringify(barcodeData),
            }
        )

        // Frappe wraps the return value in response.data.message
        const result = response.data?.message

        return {
            status:  result?.status  ?? 'error',
            message: result?.message ?? 'Unknown error',
            data:    result?.data    ?? null,
        }
    } catch (error) {
        console.error('Error updating barcode:', error)
        return {
            status:  'error',
            message: error?.response?.data?.message || error.message || 'Request failed',
            data:    null,
        }
    }
}

export const generateBarcodePreview = async (data) => {
    try {
    const response = await call('retail.retail.api.inventory.generate_barcode_img', {
        barcode_value: data.value,
        barcode_type: data.type,
    })

    console.log("api generateBarcodePreview", response)
    return response?.data || response.data?.message ||response
    }catch (error) {
        console.error("❌ generateBarcodePreview error:", error)
    }
}

export const addItemBarcode = async (barcode_data)=>{
     try {
    const response = await call('retail.retail.api.inventory.add_item_barcode', {
      barcode_data:barcode_data
    })


    return response
    }catch (error) {
        console.error("❌ generateBarcodePreview error:", error)
    }
}

export const handleDeleteBarcodeFrappe = async (item_code, barcode) => {
    try {
        const response = await api.delete('retail.retail.api.inventory.delete_item_barcode',{
             data: {
                item_code: item_code,
                barcode: barcode
            }
        })
        console.log("api handleDeleteBarcodeFrappe", response)
        return response
    }
    catch (error) {
        console.error("❌ handleDeleteBarcodeFrappe error:", error)
    }
}

export const handleUpdateBarcodeFrappe = async (barcodeName, newBarcodeValue) => {
    try {
        const response = await api.put(`/api/resource/Barcode Item/${barcodeName}`, {
            barcode: newBarcodeValue
        })
        console.log("api handleUpdateBarcodeFrappe", response)
        return response || response.data
    }
    catch (error) {
        console.error("❌ handleUpdateBarcodeFrappe error:", error)
    }
}

export const generateBarcodeValue = async (barcodeType) => {
    try {
        const response = await call(
            'retail.retail.api.inventory.generate_barcode_value',
            { barcode_type: barcodeType }
        )
        console.log("api generateBarcodeValue", response)
        return {
            status: 'success',
            value:  response?.value || ''
        }
    } catch (error) {
        console.error('generateBarcodeValue error:', error)
        return { status: 'error', value: '' }
    }
}

// ═══════════════════════════════════════════════════════
//  API Barcode Scanner
// ═══════════════════════════════════════════════════════

export const decodeBarcodeFromImage = async (imageData) => {
  try {
    const res = await call('retail.retail.api.barcode_scan.decode_barcode', {
      image_data: imageData,
      enhance: true,
    })
    console.log("📦 RAW RESPONSE:", res)
    return res
  } catch (err) {
    return {
      success: false,
      error: err?.response?.data?.message || err?.message || 'Failed to decode barcode',
    }
  }
}

export const checkBarcodeServerDeps = async () => {
  try {
    const res = await call('retail.retail.api.barcode_scan.check_dependencies')
    console.log("📦 RAW RESPONSE:", res)
    return res
  } catch {
    return { pyzbar: false, opencv: false, pillow: false, ready: false }
  }
}

export const ScanBarcodeApi = async (sessionId, barcode) => {
  try {
    const res = await call('retail.retail.api.mobile_scan.receive_barcode', {
      session_id: sessionId,
      barcode
    })
    console.log("📦 RAW RESPONSE:", res)
    return res ?? {}
  } catch (err) {
    console.error('❌ ScanBarcodeApi error:', err)
    return { found: false, error: err?.message }
  }
}
