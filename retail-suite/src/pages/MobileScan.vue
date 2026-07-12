<!-- pages/MobileScan.vue -->
<!-- Route: /mobile-scan?session=SESSION_ID  (requiresAuth: false) -->

<template>
  <div class="flex flex-col lg:flex-row h-dvh bg-slate-950 text-slate-100 font-sans overflow-hidden">

    <!-- ══ LEFT / TOP COLUMN ══════════════════════════════════════ -->
    <div class="flex flex-col lg:w-[55%] flex-shrink-0 overflow-hidden">

      <!-- ── Header ─────────────────────────────────────────────── -->
      <header class="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700 sticky top-0 z-10 flex-shrink-0">
        <div class="flex items-center gap-2">
          <div class="w-9 h-9 bg-cyan-600 rounded-xl flex items-center justify-center text-white flex-shrink-0">
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 5h2M7 5h1M3 5v2M21 5h-2M17 5h-1M21 5v2M3 19h2M7 19h1M3 19v-2M21 19h-2M17 19h-1M21 19v-2"/>
              <rect x="7" y="7" width="4" height="4" rx="0.5"/>
              <rect x="13" y="7" width="4" height="4" rx="0.5"/>
              <rect x="7" y="13" width="4" height="4" rx="0.5"/>
              <path d="M13 13h1M16 13h1M13 16h4"/>
            </svg>
          </div>
          <div>
            <h1 class="text-sm font-bold text-slate-100">Product Scanner</h1>
            <p class="text-[11px] text-slate-400">
              Session: <code class="font-mono text-sky-400">{{ shortSession }}</code>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Fast-mode toggle -->
          <button
            class="px-[10px] py-1 rounded-full border text-[11px] font-bold cursor-pointer transition-all duration-150"
            :class="fastMode
              ? 'bg-sky-950 text-sky-400 border-cyan-600'
              : 'bg-slate-800 text-slate-500 border-slate-700'"
            @click="fastMode = !fastMode"
            :title="fastMode ? 'Fast Mode ON' : 'Normal Mode'"
          >
            ⚡ {{ fastMode ? 'Fast' : 'Normal' }}
          </button>

          <!-- Status pill -->
          <div
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            :class="{
              'bg-green-950 text-green-400': socketStatus === 'connected',
              'bg-stone-900 text-amber-400': socketStatus === 'connecting',
              'bg-red-950 text-red-400':     socketStatus === 'error',
            }"
          >
            <div
              class="w-1.5 h-1.5 rounded-full"
              :class="{
                'bg-green-500 animate-pulse':  socketStatus === 'connected',
                'bg-amber-500':                socketStatus === 'connecting',
                'bg-red-500':                  socketStatus === 'error',
              }"
            />
            {{ statusText }}
          </div>
        </div>
      </header>

      <!-- ══ LOCK SCREEN (legacy mode) ══════════════════════════════ -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-8"
        leave-active-class="transition-all duration-200 ease-in"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="isLocked && !fastMode"
          class="flex-1 flex flex-col items-center justify-center gap-5 px-6 py-8 bg-slate-950"
        >
          <!-- Success ring -->
          <div class="w-24 h-24 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center animate-[ring-pop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]">
            <div class="w-[76px] h-[76px] rounded-full bg-green-500/15 border-2 border-green-500/50 flex items-center justify-center">
              <svg class="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          </div>

          <h2 class="text-[22px] font-extrabold text-slate-100 tracking-tight">Added to Cart</h2>

          <div class="w-full px-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-center">
            <div class="font-mono text-xl font-bold text-sky-400 tracking-[2px]">{{ lastSuccessBarcode }}</div>
            <div class="text-sm text-slate-400 mt-1.5">{{ lastSuccessName || 'Product found' }}</div>
          </div>

          <div class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-500">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ successCount }} item{{ successCount !== 1 ? 's' : '' }} scanned this session
          </div>

          <button
            class="flex items-center justify-center gap-2 w-full py-4 px-6 bg-cyan-600 text-white rounded-[14px] text-base font-bold border-none cursor-pointer transition-transform duration-150 active:scale-[0.97] shadow-[0_4px_20px_rgba(8,145,178,0.4)]"
            @click="unlock"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M3 5h2M7 5h1M3 5v2M21 5h-2M17 5h-1M21 5v2M3 19h2M7 19h1M3 19v-2M21 19h-2M17 19h-1M21 19v-2"/>
            </svg>
            Scan Another Product
          </button>

          <div v-if="scanHistory.length > 1" class="w-full">
            <p class="text-[11px] font-bold text-slate-500 uppercase tracking-[0.05em] mb-2">Recent</p>
            <div
              v-for="item in scanHistory.slice(0, 4)"
              :key="item.id"
              class="flex justify-between items-center px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg mb-1.5"
            >
              <span class="text-xs text-slate-300">{{ item.productName || item.barcode }}</span>
              <span class="text-xs font-bold" :class="item.found ? 'text-green-400' : 'text-red-400'">
                {{ item.found ? '✓' : '✗' }}
              </span>
            </div>
          </div>
        </div>
      </Transition>

      <!-- ══ SCANNER SECTION ═════════════════════════════════════════ -->
      <template v-if="!isLocked || fastMode">

        <!-- Camera viewport -->
        <div class="relative bg-black overflow-hidden flex-none h-[45dvh] lg:flex-1 lg:h-auto">
          <div ref="scannerEl" class="w-full h-full" />

          <!-- Corner markers -->
          <div class="absolute top-4 left-4 w-6 h-6 border-t-[3px] border-l-[3px] border-cyan-500 rounded-tl-[4px] z-[2]" />
          <div class="absolute top-4 right-4 w-6 h-6 border-t-[3px] border-r-[3px] border-cyan-500 rounded-tr-[4px] z-[2]" />
          <div class="absolute bottom-4 left-4 w-6 h-6 border-b-[3px] border-l-[3px] border-cyan-500 rounded-bl-[4px] z-[2]" />
          <div class="absolute bottom-4 right-4 w-6 h-6 border-b-[3px] border-r-[3px] border-cyan-500 rounded-br-[4px] z-[2]" />

          <!-- Scan beam -->
          <div v-if="isScanning" class="absolute left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent rounded z-[2] animate-[beam_2.5s_ease-in-out_infinite] shadow-[0_0_8px_#06b6d4]" />

          <!-- Queue depth badge -->
          <div
            v-if="apiQueue.length > 1"
            class="absolute top-3 left-1/2 -translate-x-1/2 bg-amber-500/15 border border-amber-500 text-amber-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full z-[3] pointer-events-none"
          >
            ⏳ {{ apiQueue.length }} queued
          </div>

          <!-- Camera error -->
          <div
            v-if="cameraError"
            class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 text-slate-100 z-[5] p-6 text-center"
          >
            <svg class="w-10 h-10 mb-2 opacity-60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 9v4M12 17h.01"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
            <p class="text-sm font-medium">{{ cameraError }}</p>
            <button
              class="mt-3 px-5 py-2 rounded-lg text-[13px] font-semibold bg-cyan-600 text-white border-none cursor-pointer"
              @click="startScanner"
            >Retry</button>
          </div>

          <!-- Start overlay -->
          <div
            v-if="!isScanning && !cameraError"
            class="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 text-slate-100 z-[5] p-6 text-center"
          >
            <div class="text-4xl">📷</div>
            <p class="text-sm font-medium mt-2">Tap to start scanner</p>
            <button
              class="mt-3 px-5 py-2 rounded-lg text-[13px] font-semibold bg-cyan-600 text-white border-none cursor-pointer"
              @click="startScanner"
            >Start Scanner</button>
          </div>
        </div>

        <!-- Light flash bar (fast mode) -->
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 translate-y-2"
          leave-active-class="transition-all duration-300 ease-in"
          leave-to-class="opacity-0 translate-y-1"
        >
          <div
            v-if="lightFlash"
            class="fixed bottom-20 left-3 right-3 flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-bold z-[60] shadow-[0_4px_20px_rgba(0,0,0,0.5)] pointer-events-none"
            :class="lightFlash.type === 'success'
              ? 'bg-green-950 border border-green-500 text-green-400'
              : 'bg-red-950 border border-red-500 text-red-400'"
          >
            <span class="text-lg flex-shrink-0">{{ lightFlash.type === 'success' ? '✓' : '✗' }}</span>
            <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{{ lightFlash.name }}</span>
            <span class="text-[11px] bg-white/10 px-2 py-0.5 rounded-full flex-shrink-0">×{{ successCount }}</span>
          </div>
        </Transition>

        <!-- Legacy flash -->
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          leave-active-class="transition-all duration-200 ease-in"
          leave-to-class="opacity-0 -translate-y-2"
        >
          <div
            v-if="flashMessage"
            class="fixed top-[70px] left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-4 py-2.5 rounded-xl min-w-[220px] max-w-[calc(100vw-32px)] z-50 shadow-[0_8px_24px_rgba(0,0,0,0.4)]"
            :class="flashType === 'success'
              ? 'bg-green-950 border border-green-600 text-green-200'
              : 'bg-amber-950 border border-amber-600 text-amber-200'"
          >
            <div class="text-lg flex-shrink-0">{{ flashType === 'success' ? '✓' : '⚠' }}</div>
            <div>
              <p class="text-[13px] font-semibold">{{ flashMessage }}</p>
              <p v-if="flashSub" class="text-[11px] opacity-80 mt-0.5">{{ flashSub }}</p>
            </div>
          </div>
        </Transition>

        <!-- Controls bar (mobile only — desktop shows controls in right panel) -->
        <div class="flex gap-2.5 px-4 py-3 bg-slate-800 border-t border-slate-700 flex-shrink-0 lg:hidden">
          <button
            v-if="isScanning"
            class="flex-1 py-3 rounded-xl text-sm font-bold bg-red-600 text-white border-none cursor-pointer transition-transform active:scale-[0.97]"
            @click="stopScanner"
          >Stop</button>
          <button
            v-else
            class="flex-1 py-3 rounded-xl text-sm font-bold bg-cyan-600 text-white border-none cursor-pointer transition-transform active:scale-[0.97]"
            @click="startScanner"
          >Start Scanner</button>
          <button
            class="flex-1 py-3 rounded-xl text-sm font-bold bg-slate-700 text-slate-400 border-none cursor-pointer transition-transform active:scale-[0.97]"
            @click="clearHistory"
          >Clear</button>
        </div>

      </template>
    </div>

    <!-- ══ RIGHT / BOTTOM COLUMN ══════════════════════════════════ -->
    <div class="flex flex-col flex-1 min-h-0 lg:border-l lg:border-slate-700 overflow-hidden">

      <!-- Right-panel header (desktop only) -->
      <div class="hidden lg:flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-slate-700 flex-shrink-0">
        <h2 class="text-xs font-bold text-slate-500 uppercase tracking-[0.05em]">Scanned Items</h2>
        <div class="flex items-center gap-2">
          <span class="text-xs text-slate-500">{{ successCount }} found · {{ scanHistory.length }} total</span>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-700 text-slate-400 border-none cursor-pointer transition-transform active:scale-[0.97] hover:bg-slate-600"
            @click="clearHistory"
          >Clear</button>
          <button
            v-if="isScanning"
            class="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white border-none cursor-pointer transition-transform active:scale-[0.97]"
            @click="stopScanner"
          >Stop</button>
          <button
            v-else
            class="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 text-white border-none cursor-pointer transition-transform active:scale-[0.97]"
            @click="startScanner"
          >Start</button>
        </div>
      </div>

      <!-- History list -->
      <div class="flex-1 overflow-y-auto px-4 py-3 min-h-0">
        <h2 class="text-xs font-bold text-slate-500 uppercase tracking-[0.05em] mb-2.5 lg:hidden">Scanned Items</h2>

        <div v-if="!scanHistory.length" class="flex flex-col items-center justify-center h-full py-8 text-slate-500 text-sm text-center">
          <p>No barcodes scanned yet</p>
          <p class="text-xs mt-1 opacity-60">Point camera at a product barcode</p>
        </div>

        <TransitionGroup name="list" tag="ul" class="list-none p-0 m-0 flex flex-col gap-1.5">
          <li
            v-for="item in scanHistory"
            :key="item.id"
            class="flex justify-between items-center px-3 py-2.5 bg-slate-800 border rounded-[10px] transition-colors duration-300"
            :class="item.pending
              ? 'border-cyan-600 animate-[pending-pulse_1.2s_ease-in-out_infinite]'
              : 'border-slate-700'"
          >
            <div class="font-mono text-sm font-bold text-slate-200">{{ item.barcode }}</div>
            <div class="flex flex-col items-end gap-0.5">
              <span
                class="text-[11px] font-semibold"
                :class="item.found ? 'text-green-400' : 'text-red-400'"
              >
                <span v-if="item.pending" class="inline-block w-1.5 h-1.5 bg-sky-400 rounded-full mr-1 align-middle animate-pulse" />
                {{ item.pending ? 'sending…' : (item.found ? `✓ ${item.productName}` : '✗ Not found') }}
              </span>
              <span class="text-[10px] text-slate-500">{{ item.time }}</span>
            </div>
          </li>
        </TransitionGroup>
      </div>

      <!-- Stats footer (desktop) -->
      <div class="hidden lg:flex items-center gap-4 px-5 py-3 bg-slate-900 border-t border-slate-700 flex-shrink-0">
        <div class="text-center">
          <div class="text-lg font-extrabold text-green-400">{{ successCount }}</div>
          <div class="text-[10px] text-slate-500 uppercase tracking-wider">Found</div>
        </div>
        <div class="w-px h-8 bg-slate-700" />
        <div class="text-center">
          <div class="text-lg font-extrabold text-red-400">{{ scanHistory.filter(i => !i.found && !i.pending).length }}</div>
          <div class="text-[10px] text-slate-500 uppercase tracking-wider">Not Found</div>
        </div>
        <div class="w-px h-8 bg-slate-700" />
        <div class="text-center">
          <div class="text-lg font-extrabold text-slate-300">{{ scanHistory.length }}</div>
          <div class="text-[10px] text-slate-500 uppercase tracking-wider">Total</div>
        </div>
        <div class="flex-1" />
        <div
          class="text-[11px] font-semibold px-2.5 py-1 rounded-full"
          :class="fastMode ? 'bg-sky-950 text-sky-400' : 'bg-slate-800 text-slate-500'"
        >
          {{ fastMode ? '⚡ Fast mode' : '🔒 Normal mode' }}
        </div>
      </div>
    </div>

  </div>
</template>

<style>
/* Keyframe animations not expressible in pure Tailwind utilities */
@keyframes ring-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.1); }
  100% { transform: scale(1);   opacity: 1; }
}

@keyframes beam {
  0%   { top: 15%; opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { top: 85%; opacity: 0; }
}

@keyframes pending-pulse {
  0%, 100% { border-color: #0891b2; }
  50%       { border-color: #334155; }
}

/* Quagga video fill */
.scanner-viewport video,
[ref="scannerEl"] video {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
[ref="scannerEl"] canvas { display: none !important; }

/* TransitionGroup list animation */
.list-enter-active { transition: all 0.25s ease; }
.list-enter-from   { opacity: 0; transform: translateY(-8px); }
</style>

<script setup>
import { ScanBarcodeApi } from '@/composables/barcode'
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// ── Session ───────────────────────────────────────────────────────────────────
const sessionId    = computed(() => route.query.session || '')
const shortSession = computed(() => sessionId.value.slice(-8) || '—')

// ── Refs ──────────────────────────────────────────────────────────────────────
const scannerEl          = ref(null)
const isScanning         = ref(false)
const cameraError        = ref('')
const scanHistory        = ref([])
const flashMessage       = ref('')
const flashSub           = ref('')
const flashType          = ref('success')
const isLocked           = ref(false)
const lastSuccessBarcode = ref('')
const lastSuccessName    = ref('')
const socketStatus       = ref('connecting')

const fastMode   = ref(true)
const lightFlash = ref(null)
let   lightFlashTimer = null

const apiQueue  = ref([])
let   queueBusy = false

const pendingScans = new Map()

const successCount = computed(() => scanHistory.value.filter(i => i.found).length)

const statusText = computed(() => {
  if (socketStatus.value === 'connected') return 'Connected to POS'
  if (socketStatus.value === 'error')     return 'Connection Error'
  return 'Connecting…'
})

// ── Lock / unlock ─────────────────────────────────────────────────────────────
const lockScreen = (barcode, productName) => {
  lastSuccessBarcode.value = barcode
  lastSuccessName.value    = productName || ''
  isLocked.value = true
  stopScanner()
}

const unlock = () => {
  isLocked.value = false
  nextTick(() => startScanner())
}

// ── Debounce ──────────────────────────────────────────────────────────────────
let lastBarcode     = ''
let lastBarcodeTime = 0
const DEBOUNCE_MS   = 600

// ── Audio + haptic ────────────────────────────────────────────────────────────
const beepOnSuccess = () => {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 1046
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12)
  } catch { /* ignore */ }
}
const vibrateSuccess = () => navigator.vibrate?.([60])
const vibrateError   = () => navigator.vibrate?.([80, 40, 80])

const showLightFlash = (type, name = '') => {
  lightFlash.value = { type, name }
  if (lightFlashTimer) clearTimeout(lightFlashTimer)
  lightFlashTimer = setTimeout(() => { lightFlash.value = null }, 1200)
}

// ── Queue processor ───────────────────────────────────────────────────────────
const processQueue = async () => {
  if (queueBusy || apiQueue.value.length === 0) return
  queueBusy = true
  while (apiQueue.value.length > 0) {
    const { barcode, entryId } = apiQueue.value.shift()
    try {
      const res  = await ScanBarcodeApi(sessionId.value, barcode)
      socketStatus.value = 'connected'
      const data = res?.data?.message || res?.message || res?.data || res || {}
      const entry = pendingScans.get(entryId)
      if (entry) {
        entry.found       = data?.found ?? false
        entry.productName = data?.item_name || entry.productName
        entry.pending     = false
        if (!entry.found) vibrateError()
        pendingScans.delete(entryId)
      }
    } catch (err) {
      console.error('Queue API error:', err)
      socketStatus.value = 'error'
      const entry = pendingScans.get(entryId)
      if (entry) {
        entry.found = false; entry.productName = '[API Error]'; entry.pending = false
        vibrateError(); pendingScans.delete(entryId)
      }
    }
  }
  queueBusy = false
}

const enqueueBarcode = (barcode, entryId) => {
  apiQueue.value.push({ barcode, entryId })
  processQueue()
}

const sendBarcode = async (barcode) => {
  try {
    const res = await ScanBarcodeApi(sessionId.value, barcode)
    socketStatus.value = 'connected'
    const data = res?.data?.message || res?.message || res?.data || res
    return data || {}
  } catch (err) {
    console.error('Send barcode error:', err)
    socketStatus.value = 'error'
    return { success: false, found: false }
  }
}

// ── QuaggaJS ──────────────────────────────────────────────────────────────────
const loadQuagga = () =>
  new Promise((resolve, reject) => {
    if (window.Quagga) { resolve(); return }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js'
    s.onload = resolve
    s.onerror = () => reject(new Error('Failed to load QuaggaJS'))
    document.head.appendChild(s)
  })

const startScanner = async () => {
  cameraError.value = ''
  try {
    await loadQuagga()
    await nextTick()
    // eslint-disable-next-line no-undef
    Quagga.init(
      {
        inputStream: {
          name: 'Live', type: 'LiveStream', target: scannerEl.value,
          constraints: {
            width:      fastMode.value ? { ideal: 640 }  : { ideal: 1280 },
            height:     fastMode.value ? { ideal: 480 }  : { ideal: 720 },
            facingMode: 'environment',
          },
        },
        decoder: {
          readers: ['ean_reader','ean_8_reader','code_128_reader','code_39_reader','upc_reader','upc_e_reader'],
          multiple: false,
        },
        locate: true,
        numOfWorkers: navigator.hardwareConcurrency || 4,
        frequency:    fastMode.value ? 15 : 10,
      },
      (err) => {
        if (err) { cameraError.value = err.message || 'Camera access denied'; isScanning.value = false; return }
        // eslint-disable-next-line no-undef
        Quagga.start()
        isScanning.value = true
      }
    )
    // eslint-disable-next-line no-undef
    Quagga.onDetected(onBarcodeDetected)
  } catch (err) {
    cameraError.value = err.message
  }
}

const stopScanner = () => {
  if (!window.Quagga) return
  try { window.Quagga.stop() } catch { /* already stopped */ }
  isScanning.value = false
}

// ── Barcode detected ──────────────────────────────────────────────────────────
const onBarcodeDetected = async (result) => {
  const barcode = result?.codeResult?.code
  if (!barcode) return

  const now = Date.now()
  if (barcode === lastBarcode && now - lastBarcodeTime < DEBOUNCE_MS) return
  lastBarcode     = barcode
  lastBarcodeTime = now

  if (fastMode.value) {
    const entryId = now
    const entry = reactive({
      id: entryId, barcode, found: true, productName: '…', pending: true,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    })
    scanHistory.value.unshift(entry)
    if (scanHistory.value.length > 20) scanHistory.value.pop()
    pendingScans.set(entryId, entry)
    vibrateSuccess(); beepOnSuccess(); showLightFlash('success', barcode)
    enqueueBarcode(barcode, entryId)
    return
  }

  // Legacy mode
  showFlash(`Sending: ${barcode}`, '', 'success')
  const response = await sendBarcode(barcode)
  const entry = {
    id: now, barcode, found: response?.found ?? false, productName: response?.item_name || '', pending: false,
    time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  }
  scanHistory.value.unshift(entry)
  if (scanHistory.value.length > 20) scanHistory.value.pop()
  if (response?.found) {
    lockScreen(barcode, response.item_name)
  } else {
    showFlash(`Not found: ${barcode}`, 'Product not in POS catalog', 'warning')
  }
}

let flashTimer = null
const showFlash = (msg, sub = '', type = 'success') => {
  flashMessage.value = msg; flashSub.value = sub; flashType.value = type
  if (flashTimer) clearTimeout(flashTimer)
  flashTimer = setTimeout(() => { flashMessage.value = '' }, 2500)
}

const clearHistory = () => { scanHistory.value = [] }

watch(sessionId, (val) => {
  if (val) startScanner()
}, { immediate: true })

onUnmounted(() => {
  stopScanner()
  if (flashTimer) clearTimeout(flashTimer)
  if (lightFlashTimer) clearTimeout(lightFlashTimer)
  pendingScans.clear()
  apiQueue.value = []
})
</script>
