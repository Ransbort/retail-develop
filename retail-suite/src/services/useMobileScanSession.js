//  src/services/useMobileScanSession.js

import { ref, onUnmounted } from 'vue'
import { useCartStore } from '@/stores/cart'
import { useProductsStore } from '@/stores/products'

// Keep sessionId outside the function so it persists across component re-mounts
// const stableSessionId = ref(`${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
const stableSessionId = ref(`test123`)

export function useMobileScanSession() {
  const isListening = ref(false)
  const lastScanned = ref(null)
  const pairingConfirmed = ref(false)

  const cartStore = useCartStore()
  const productsStore = useProductsStore()

  const _onBarcodeReceived = (data) => {
    // 1. Robust Payload Parsing

    const payload = data?.message || data;
    console.log("🚀 Received Scan:", JSON.stringify(payload));

    if (!payload || !payload.barcode) return;

    // 2. Immediate Feedback
    pairingConfirmed.value = true;

    if (!payload.found) {
      window.$toast?.error(`Item ${payload.barcode} not found in Database`);
      return;
    }
    console.log("products",JSON.stringify(productsStore.products))  // Debug: Check products in store
    // 3. Match Product in Pinia Store
    // We check both item_code AND check the barcodes array within each product
    const product = productsStore.products.find(p => {
    const matchCode = p.item_code === payload.item_code;

    const matchBarc =
      p.barcode === payload.barcode || // single
      p.item_barcode?.some(b => b.barcode === payload.barcode) || // ERPNext
      p.barcodes?.some(b => b.barcode === payload.barcode); // fallback

      return matchCode || matchBarc;
    });

    if (product) {
      // 4. Add to Cart
      cartStore.addToCart(product);
      lastScanned.value = { productName: product.item_name };

      // Visual feedback on Desktop
      window.$toast?.success(`Added ${product.item_name} via Mobile`);
      console.log("✅ Added to cart:", product.item_name);
    } else {
      console.error("❌ Product found in DB but not in local productsStore", payload);
      window.$toast?.warning("Product not found in current POS Profile");
    }
  }

  const startListening = () => {
    if (!window.frappe?.realtime) {
      console.error("Frappe Realtime not initialized");
      return;
    }

    // const eventName = `barcode_scan_${stableSessionId.value}`;
    const eventName = `barcode_scan_test123`;
    console.log("🟢 MY SESSION:", stableSessionId.value)
    console.log("🟢 MY EVENT:", eventName)

    // Clean up to prevent duplicate cart additions
    window.frappe.realtime.off(eventName);
    window.frappe.realtime.on(eventName, _onBarcodeReceived);

    isListening.value = true;
    console.log("📡 Listening for Mobile on:", eventName);
  }

  const stopListening = () => {
    const eventName = `barcode_scan_${stableSessionId.value}`;
    window.frappe.realtime.off(eventName);
    isListening.value = false;
  }

  return {
    sessionId: stableSessionId,
    isListening,
    lastScanned,
    pairingConfirmed,
    startListening,
    stopListening,
    getScannerUrl: () => `${window.location.origin}/mobile-scan?session=${stableSessionId.value}`
  }
}
