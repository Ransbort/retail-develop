// src/i18n/index.js
import { ref } from 'vue'

const translationVersion = ref(0)
let _versionDebounce = null

// ============================================================================
// CORE
// ============================================================================

export function translate(msg, replace, ctx) {
  const messages = window.translatedMessages || {}
  const key = ctx ? `${msg}:${ctx}` : msg
  let translated = messages[key] || messages[msg] || msg

  if (replace) {
    translated = translated.replace(/{(\d+)}/g, (_, n) => replace[n] ?? _)
  }

  return translated
}

export const __ = translate

// ============================================================================
// LOCALE
// ============================================================================

const FALLBACK_LOCALE = 'en'

const getLocale = () => {
  return (
    localStorage.getItem('retail_language') ||
    window?.frappe?.boot?.lang?.toLowerCase() ||
    FALLBACK_LOCALE
  )
}

export const getCurrentLocale = getLocale

// ============================================================================
// APPLY
// ============================================================================

function applyMessages(messages) {
  window.translatedMessages = messages
  if (_versionDebounce) clearTimeout(_versionDebounce)
  _versionDebounce = setTimeout(() => {
    translationVersion.value++
    _versionDebounce = null
  }, 100)
}

// ============================================================================
// FETCH
// ============================================================================
// test it await $changeLanguage('ar') in console
async function fetchTranslations(locale) {
  try {
    const response = await fetch(
      `/api/method/retail.retail.api.i18n.get_translations?lang=${locale}`,
      { cache: 'no-store' }
    )
    if (!response.ok) return null
    const data = await response.json()
    console.log("📦 fetchTranslations response:", data)
    return data.message || null
  } catch {
    return null
  }
}

// ============================================================================
// LOAD
// ============================================================================

export async function loadLocale(locale) {
  const target = locale || getLocale()

  // Get translations from localStorage

  const cached = localStorage.getItem(`retail_translations_${target}`)
  if (cached) {
    try {
      console.log("📦 TTTTTTTTTTTT:", target)
      const { messages, timestamp, target } = JSON.parse(cached)
      console.log("📦 T :", target)
      applyMessages(messages)

      const isStale = Date.now() - timestamp > 24 * 60 * 60 * 1000
      if (!isStale) return JSON.parse(cached)

    } catch {
      localStorage.removeItem(`retail_translations_${target}`)
      return {}
    }
  }
  // Get translations from server
  const messages = await fetchTranslations(target)
  if (messages) {
    applyMessages(messages)
    localStorage.setItem(`retail_translations_${target}`, JSON.stringify({
      messages,
      timestamp: Date.now(),
    }))
    return messages || {}
  }

  return !!cached
}

// ============================================================================
// CHANGE LANGUAGE
// ============================================================================

export async function changeLanguage(locale) {
  localStorage.setItem('retail_language', locale)
  localStorage.removeItem(`retail_translations_${locale}`)

  await loadLocale(locale)

  document.documentElement.dir = 'ltr'
  document.documentElement.lang = locale
}

// ============================================================================
// VUE PLUGIN
// ============================================================================

export default {
  install(app) {
    app.config.globalProperties.__ = translate
    window.__ = translate
    window.$changeLanguage = changeLanguage

    loadLocale(getLocale())
  }
}
