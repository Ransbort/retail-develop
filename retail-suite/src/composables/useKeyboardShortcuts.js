// composables/useKeyboardShortcuts.js
import { onMounted, onUnmounted } from 'vue'

/**
 * الـ shortcuts المعرفة في Settings.vue:
 * 1. إتمام البيع     → Enter
 * 2. إلغاء المعاملة  → Esc
 * 3. بحث السريع     → Ctrl+F
 * 4. جديد           → Ctrl+N
 * 5. حفظ            → Ctrl+S
 * 6. طباعة          → Ctrl+P
 */
export function useKeyboardShortcuts({
  onEnter,      // إتمام البيع
  onEscape,     // إلغاء المعاملة
  onSearch,     // بحث السريع  (Ctrl+F)
  onNew,        // جديد         (Ctrl+N)
  onSave,       // حفظ          (Ctrl+S)
  onPrint,      // طباعة        (Ctrl+P)
} = {}) {

  const handler = (e) => {
    const tag = document.activeElement?.tagName?.toLowerCase()
    const isTyping = ['input', 'textarea', 'select'].includes(tag)

    // ── Enter → إتمام البيع (مش جوه input) ──────────────────────
    if (e.key === 'Enter' && !isTyping && !e.ctrlKey && !e.metaKey) {
      e.preventDefault()
      onEnter?.()
      return
    }

    // ── Escape → إلغاء ───────────────────────────────────────────
    if (e.key === 'Escape') {
      onEscape?.()
      return
    }

    // ── Ctrl/Cmd shortcuts ────────────────────────────────────────
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {

        case 'f':                   // Ctrl+F → بحث
          e.preventDefault()
          onSearch?.()
          break

        case 'n':                   // Ctrl+N → جديد
          e.preventDefault()
          onNew?.()
          break

        case 's':                   // Ctrl+S → حفظ
          e.preventDefault()
          onSave?.()
          break

        case 'p':                   // Ctrl+P → طباعة
          e.preventDefault()
          onPrint?.()
          break
      }
    }
  }

  onMounted(()  => document.addEventListener('keydown', handler))
  onUnmounted(() => document.removeEventListener('keydown', handler))
}
