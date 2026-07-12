<!-- components/MobileScanOverlay.vue -->
<template>
  <Teleport to="body">

    <!-- ══ OVERLAY ══ -->
    <Transition name="bu-overlay">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        style="background: rgba(0,0,0,0.55); backdrop-filter: blur(3px);"
        @click.self="close"
        aria-modal="true"
        role="dialog"
        :aria-label="__('Product Scanner')"
      >

        <!-- ══ DIALOG ══ -->
        <Transition name="bu-dialog">
          <div
            v-if="modelValue"
            class="flex flex-col overflow-hidden rounded-[12px]"
            style="
              width: 95vw;
              height: 92vh;
              max-width: 1500px;
              background: var(--card-bg);
              border: 1px solid var(--card-border);
              box-shadow: 0 24px 64px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04);
            "
          >

            <!-- ── TOP BAR ── -->
            <div
              class="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
              style="border-bottom: 1px solid var(--card-border); background: var(--item-bg);"
            >
              <div class="flex items-center gap-2">
                <span
                  class="flex items-center justify-center w-7 h-7 rounded-[6px] text-white flex-shrink-0"
                  style="background: var(--focus-ring);"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                    <path d="M3 5h2M7 5h1M3 5v2M21 5h-2M17 5h-1M21 5v2M3 19h2M7 19h1M3 19v-2M21 19h-2M17 19h-1M21 19v-2"/>
                    <rect x="7" y="7" width="4" height="4" rx="0.5"/>
                    <rect x="13" y="7" width="4" height="4" rx="0.5"/>
                    <rect x="7" y="13" width="4" height="4" rx="0.5"/>
                    <path d="M13 13h1M16 13h1M13 16h4"/>
                  </svg>
                </span>
                <span class="text-[13px] font-bold tracking-[0.01em]" style="color: var(--text-main);">{{ __('Product Scanner') }}</span>
                <span
                  class="text-[9px] font-bold px-1.5 py-0.5 rounded-[4px] tracking-[0.08em]"
                  style="background: var(--info-bg); color: var(--focus-ring);"
                >{{ __('POS') }} {{ activeTab }}</span>
              </div>

              <div class="flex items-center gap-2">
                <!-- Fast mode -->
                <button
                  class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-150"
                  :style="fastMode
                    ? 'background: var(--info-bg); color: var(--focus-ring); border: 1px solid var(--focus-ring);'
                    : 'background: transparent; color: var(--text-muted); border: 1px solid var(--card-border);'"
                  @click="fastMode = !fastMode"
                >
                  ⚡ {{ fastMode ? __('Fast') : __('Normal') }}
                </button>

                <!-- Status dot -->
                <div
                  class="w-2 h-2 rounded-full transition-colors"
                  :class="{
                    'bg-green-500 animate-pulse': socketStatus === 'connected',
                    'bg-amber-400':               socketStatus === 'connecting',
                    'bg-red-500':                 socketStatus === 'error',
                  }"
                  :title="statusText"
                />

                <!-- Close -->
                <button
                  class="flex items-center justify-center w-7 h-7 rounded-[6px] border-none cursor-pointer transition-all duration-150"
                  style="background: transparent; color: var(--text-muted);"
                  @mouseover="e => e.currentTarget.style.background = 'var(--nav-item-hover-bg)'"
                  @mouseleave="e => e.currentTarget.style.background = 'transparent'"
                  @click="close"
                  :aria-label="__('Close')"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- ── TAB BAR ── -->
            <div
              class="flex flex-shrink-0"
              style="border-bottom: 1px solid var(--card-border); background: var(--item-bg);"
            >
              <button
                v-for="tab in [{ id: 'camera', label: __('Camera'), icon: '📷' }, { id: 'phone', label: __('Phone QR'), icon: '📱' }]"
                :key="tab.id"
                class="flex items-center gap-1.5 px-5 py-2.5 text-[12px] font-semibold transition-all relative"
                :style="activeTab === tab.id
                  ? 'color: var(--focus-ring); background: var(--card-bg);'
                  : 'color: var(--text-muted); background: transparent;'"
                @click="activeTab = tab.id"
              >
                {{ tab.icon }} {{ tab.label }}
                <span
                  v-if="activeTab === tab.id"
                  class="absolute bottom-0 left-0 right-0 h-[2px] rounded-t"
                  style="background: var(--focus-ring);"
                />
              </button>
            </div>

            <!-- ── BODY: left camera + right panel tab ── -->
            <div v-show="activeTab === 'camera'" class="flex flex-1 min-h-0 overflow-hidden">
              <div class="flex flex-1 min-h-0 overflow-hidden">

                <!-- ══ LEFT: Camera + Manual Input ══ -->
                <div
                  class="flex flex-col flex-shrink-0 overflow-hidden"
                  style="width: 420px; border-right: 1px solid var(--card-border);"
                >

                  <!-- Camera viewport -->
                  <div class="relative overflow-hidden flex-shrink-0 bg-black" style="height: 280px;">
                    <div ref="scannerEl" class="w-full h-full scanner-target" />

                    <!-- Corner markers -->
                    <div class="absolute top-3 left-3 w-5 h-5 border-t-[3px] border-l-[3px] border-[var(--focus-ring)] rounded-tl z-[2]" />
                    <div class="absolute top-3 right-3 w-5 h-5 border-t-[3px] border-r-[3px] border-[var(--focus-ring)] rounded-tr z-[2]" />
                    <div class="absolute bottom-3 left-3 w-5 h-5 border-b-[3px] border-l-[3px] border-[var(--focus-ring)] rounded-bl z-[2]" />
                    <div class="absolute bottom-3 right-3 w-5 h-5 border-b-[3px] border-r-[3px] border-[var(--focus-ring)] rounded-br z-[2]" />

                    <!-- Scan beam -->
                    <div v-if="isScanning" class="scan-beam absolute left-[8%] right-[8%] h-px z-[2]" style="box-shadow: 0 0 6px var(--focus-ring);" />

                    <!-- Type badge after scan -->
                    <Transition name="badge-pop">
                      <div
                        v-if="resolvedType"
                        class="absolute top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold z-[3] bg-white shadow-md"
                        :style="typeBadgeStyle[resolvedType]"
                      >
                        {{ typeStyles[resolvedType]?.icon }} {{ typeLabels[resolvedType] }}
                      </div>
                    </Transition>

                    <!-- Camera error overlay -->
                    <div
                      v-if="cameraError"
                      class="absolute inset-0 flex flex-col items-center justify-center z-[5] p-6 text-center"
                      style="background: rgba(0,0,0,0.85);"
                    >
                      <div class="text-3xl mb-2">📷</div>
                      <p class="text-sm text-white/80 font-medium">{{ cameraError }}</p>
                      <button class="mt-3 px-4 py-1.5 rounded-[6px] text-xs font-bold text-white" style="background: var(--focus-ring);" @click="startScanner">{{ __('Retry') }}</button>
                    </div>

                    <!-- Start overlay -->
                    <div
                      v-if="!isScanning && !cameraError"
                      class="absolute inset-0 flex flex-col items-center justify-center z-[5] p-6 text-center"
                      style="background: rgba(0,0,0,0.85);"
                    >
                      <div class="text-3xl mb-2">📷</div>
                      <p class="text-sm font-medium" style="color: rgba(255,255,255,0.7);">{{ __('Tap to start camera') }}</p>
                      <button class="mt-3 px-4 py-1.5 rounded-[6px] text-xs font-bold text-white" style="background: var(--focus-ring);" @click="startScanner">{{ __('Start Scanner') }}</button>
                    </div>
                  </div>

                  <!-- Manual input -->
                  <div
                    class="flex gap-2 items-center px-3 py-2.5 flex-shrink-0"
                    style="border-bottom: 1px solid var(--card-border); background: var(--item-bg);"
                  >
                    <div class="relative flex-1">
                      <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style="color: var(--text-muted);" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                        <path d="M3 5h2M7 5h1M3 5v2M21 5h-2M17 5h-1M21 5v2M3 19h2M7 19h1M3 19v-2M21 19h-2M17 19h-1M21 19v-2"/>
                      </svg>
                      <input
                        ref="manualInputRef"
                        v-model="manualInput"
                        type="text"
                        :placeholder="__('Barcode / Serial / Batch…')"
                        class="w-full pl-8 pr-7 py-1.5 rounded-[6px] text-[13px] font-mono outline-none transition-all"
                        style="background: var(--input-bg); color: var(--text-main); border: 1.5px solid var(--focus-ring);"
                        @keydown.enter="submitManual"
                        @keydown.escape="manualInput = ''"
                      />
                      <button
                        v-if="manualInput"
                        class="absolute right-2 top-1/2 -translate-y-1/2"
                        style="color: var(--text-muted);"
                        @click="manualInput = ''"
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <button
                      class="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                      style="background: var(--focus-ring);"
                      :disabled="!manualInput.trim() || isResolving"
                      @click="submitManual"
                    >
                      <span v-if="isResolving" class="bu-spinner" />
                      <span v-else>{{ __('Send') }}</span>
                    </button>
                  </div>

                  <!-- Camera controls -->
                  <div
                    class="flex items-center gap-2 px-3 py-2 flex-shrink-0"
                    style="border-bottom: 1px solid var(--card-border); background: var(--item-bg);"
                  >
                    <button
                      v-if="isScanning"
                      class="flex-1 py-1.5 rounded-[6px] text-[11px] font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors"
                      @click="stopScanner"
                    >{{ __('Stop Camera') }}</button>
                    <button
                      v-else
                      class="flex-1 py-1.5 rounded-[6px] text-[11px] font-semibold text-white transition-opacity"
                      style="background: var(--focus-ring);"
                      @click="startScanner"
                    >{{ __('Start Camera') }}</button>

                    <button
                      class="px-3 py-1.5 rounded-[6px] text-[11px] font-semibold transition-all"
                      style="background: var(--item-bg); color: var(--text-muted); border: 1px solid var(--card-border);"
                      @click="scanHistory = []"
                    >{{ __('Clear') }}</button>
                  </div>

                  <!-- Stats bar -->
                  <div
                    class="flex items-center gap-4 px-4 py-2.5 flex-shrink-0 mt-auto"
                    style="border-top: 1px solid var(--card-border); background: var(--item-bg);"
                  >
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-[15px] font-extrabold text-green-500">{{ addedCount }}</span>
                      <span class="text-[9px] uppercase tracking-[0.06em]" style="color: var(--text-muted);">{{ __('Added') }}</span>
                    </div>
                    <div class="w-px h-5" style="background: var(--card-border);" />
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-[15px] font-extrabold text-red-500">{{ notFoundCount }}</span>
                      <span class="text-[9px] uppercase tracking-[0.06em]" style="color: var(--text-muted);">{{ __('Not Found') }}</span>
                    </div>
                    <div class="w-px h-5" style="background: var(--card-border);" />
                    <div class="flex flex-col items-center gap-0.5">
                      <span class="text-[15px] font-extrabold" style="color: var(--text-main);">{{ scanHistory.length }}</span>
                      <span class="text-[9px] uppercase tracking-[0.06em]" style="color: var(--text-muted);">{{ __('Total') }}</span>
                    </div>
                    <div class="flex-1" />
                    <span
                      class="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                      :style="fastMode
                        ? 'background: var(--info-bg); color: var(--focus-ring);'
                        : 'background: var(--item-bg); color: var(--text-muted); border: 1px solid var(--card-border);'"
                    >{{ fastMode ? __('⚡ Fast') : __('🔒 Normal') }}</span>
                  </div>
                </div>

                <!-- ══ RIGHT: Results + History ══ -->
                <div class="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden">

                  <!-- Right header -->
                  <div
                    class="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
                    style="border-bottom: 1px solid var(--card-border); background: var(--item-bg);"
                  >
                    <span class="text-[10px] font-bold uppercase tracking-[0.06em]" style="color: var(--text-muted);">{{ __('Scan Results') }}</span>
                    <span class="text-[11px]" style="color: var(--text-muted);">{{ __('added · {0} total', [scanHistory.length]) }}</span>
                  </div>

                  <!-- Resolving -->
                  <div v-if="isResolving" class="flex items-center justify-center gap-3 py-10" style="color: var(--text-muted);">
                    <div class="w-5 h-5 border-2 rounded-full animate-spin" style="border-color: var(--card-border); border-top-color: var(--focus-ring);" />
                    <span class="text-sm">{{ __('Resolving…') }}</span>
                  </div>

                  <!-- Scroll area -->
                  <div class="flex-1 overflow-y-auto min-h-0 p-4" style="scrollbar-width: thin;">

                    <!-- Confirmation card -->
                    <Transition name="card-rise">
                      <div
                        v-if="pendingConfirm && !isResolving"
                        class="rounded-[8px] overflow-hidden mb-4"
                        :style="`border: 1px solid var(--card-border); border-top: 3px solid ${typeAccent[pendingConfirm.type]};`"
                      >
                        <!-- Card header -->
                        <div
                          class="flex items-center gap-2 px-3.5 py-2"
                          style="border-bottom: 1px solid var(--card-border); background: var(--item-bg);"
                        >
                          <span class="text-sm">{{ typeStyles[pendingConfirm.type]?.icon }}</span>
                          <span class="text-[11px] font-bold uppercase tracking-[0.05em]" :style="`color: ${typeAccent[pendingConfirm.type]};`">
                            {{ typeLabels[pendingConfirm.type] }}
                          </span>
                        </div>

                        <!-- Card body -->
                        <div class="px-3.5 py-3" style="background: var(--card-bg);">
                          <div class="text-[14px] font-semibold leading-tight" style="color: var(--text-main);">
                            {{ pendingConfirm.item_name || pendingConfirm.item_code }}
                          </div>
                          <div class="text-[11px] font-mono mt-0.5" style="color: var(--text-muted);">
                            {{ pendingConfirm.item_code }}
                          </div>

                          <div class="flex flex-wrap gap-1.5 mt-2.5">
                            <span v-if="pendingConfirm.serial_no" class="text-[11px] font-mono px-2 py-0.5 rounded-[4px]" style="background: var(--info-bg); color: var(--focus-ring);">
                              {{ __('S/N') }}: {{ pendingConfirm.serial_no }}
                            </span>
                            <span v-if="pendingConfirm.batch_no" class="text-[11px] font-mono px-2 py-0.5 rounded-[4px]" style="background: var(--warning-bg); color: var(--warning-border);">
                              {{ __('Batch') }}: {{ pendingConfirm.batch_no }}
                            </span>
                            <span v-if="pendingConfirm.uom" class="text-[10px] px-2 py-0.5 rounded-[4px]" style="background: var(--item-bg); color: var(--text-muted); border: 1px solid var(--card-border);">
                              {{ pendingConfirm.uom }}
                            </span>
                            <span v-if="pendingConfirm.actual_qty !== undefined" class="text-[10px] px-2 py-0.5 rounded-[4px]" style="background: var(--item-bg); color: var(--text-muted); border: 1px solid var(--card-border);">
                              {{ __('Stock') }}: {{ pendingConfirm.actual_qty }}
                            </span>
                          </div>
                        </div>

                        <!-- Card actions -->
                        <div
                          class="flex gap-2 px-3.5 py-2.5"
                          style="border-top: 1px solid var(--card-border); background: var(--item-bg);"
                        >
                          <button
                            class="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[6px] text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                            style="background: var(--focus-ring);"
                            @click="confirmAdd"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
                            {{ __('Add to Cart') }}
                          </button>
                          <button
                            class="px-4 py-2 rounded-[6px] text-[12px] font-medium transition-all"
                            style="background: var(--item-bg); color: var(--text-sub); border: 1px solid var(--card-border);"
                            @mouseover="e => e.currentTarget.style.background = 'var(--nav-item-hover-bg)'"
                            @mouseleave="e => e.currentTarget.style.background = 'var(--item-bg)'"
                            @click="cancelConfirm"
                          >{{ __('Cancel') }}</button>
                        </div>
                      </div>
                    </Transition>

                    <!-- Empty state -->
                    <div
                      v-if="!scanHistory.length && !pendingConfirm && !isResolving"
                      class="flex flex-col items-center justify-center py-16 gap-2 text-center"
                      style="color: var(--text-muted);"
                    >
                      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" style="opacity:.25">
                        <path d="M3 5h2M7 5h1M3 5v2M21 5h-2M17 5h-1M21 5v2M3 19h2M7 19h1M3 19v-2M21 19h-2M17 19h-1M21 19v-2"/>
                        <rect x="7" y="7" width="4" height="4" rx="0.5"/>
                        <rect x="13" y="7" width="4" height="4" rx="0.5"/>
                        <rect x="7" y="13" width="4" height="4" rx="0.5"/>
                      </svg>
                      <p class="text-[13px]">{{ __('No scans yet') }}</p>
                      <p class="text-[11px] opacity-60">{{ __('Use camera or type a value in the input') }}</p>
                    </div>

                    <!-- History header -->
                    <div
                      v-if="scanHistory.length"
                      class="flex items-center justify-between mb-2"
                    >
                      <span class="text-[10px] font-bold uppercase tracking-[0.06em]" style="color: var(--text-muted);">{{ __('Recent scans') }}</span>
                    </div>

                    <!-- History list -->
                    <TransitionGroup name="scan-list" tag="ul" class="flex flex-col gap-1.5 list-none p-0 m-0">
                      <li
                        v-for="item in scanHistory"
                        :key="item.id"
                        class="flex items-center gap-3 px-3 py-2.5 rounded-[7px] transition-colors"
                        :style="item.pending
                          ? `border: 1px solid var(--focus-ring); background: var(--info-bg);`
                          : item.found
                            ? `border: 1px solid var(--card-border); border-left: 3px solid #22c55e; background: var(--card-bg);`
                            : `border: 1px solid var(--card-border); border-left: 3px solid #ef4444; background: var(--card-bg);`"
                      >
                        <span class="text-sm flex-shrink-0">{{ item.type ? typeStyles[item.type]?.icon : '📦' }}</span>

                        <div class="flex-1 min-w-0">
                          <div class="text-[12px] font-semibold truncate" style="color: var(--text-main);">
                            {{ item.found ? (item.item_name || item.item_code) : item.rawValue }}
                          </div>
                          <div class="text-[10px] font-mono truncate" style="color: var(--text-muted);">
                            {{ item.pending ? __('resolving…') : (item.found ? item.item_code : __('Not found')) }}
                          </div>
                        </div>

                        <div class="flex flex-col items-end gap-0.5 flex-shrink-0">
                          <span
                            class="text-[11px] font-bold"
                            :class="item.found ? 'text-green-500' : 'text-red-500'"
                          >{{ item.pending ? '…' : (item.found ? '✓' : '✗') }}</span>
                          <span class="text-[10px]" style="color: var(--text-muted);">{{ item.time }}</span>
                        </div>
                      </li>
                    </TransitionGroup>
                  </div>
                </div>
              </div>
            </div>

            <!-- ── BODY: Phone QR tab ── -->
            <div
              v-show="activeTab === 'phone'"
              class="flex flex-1 min-h-0 overflow-hidden items-start justify-center p-6 overflow-y-auto"
              style="background: var(--card-bg);"
            >
              <div class="flex flex-col items-center gap-4 w-full max-w-sm">

                <!-- Status pill -->
                <div
                  class="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  :style="isListening
                    ? 'background:#dcfce7; color:#16a34a;'
                    : 'background:#fef9c3; color:#ca8a04;'"
                >
                  <div class="w-2 h-2 rounded-full" :class="isListening ? 'bg-green-500 animate-pulse' : 'bg-yellow-400'" />
                  {{ isListening ? __('Listening for barcodes…') : __('Initializing…') }}
                </div>

                <!-- QR canvas -->
                <div class="relative rounded-xl p-3" style="background: #fff; border: 1px solid var(--card-border);">
                  <canvas ref="qrCanvas" class="block" />
                  <div class="absolute inset-3 overflow-hidden rounded-lg pointer-events-none">
                    <div class="qr-scan-line" />
                  </div>
                </div>

                <!-- Session URL + copy -->
                <div class="w-full">
                  <p class="text-xs text-center mb-1" style="color: var(--text-muted);">{{ __('Session ID') }}</p>
                  <div
                    class="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style="background: var(--item-bg); border: 1px solid var(--card-border);"
                  >
                    <code class="flex-1 text-xs truncate font-mono" style="color: var(--text-main);">{{ sessionId }}</code>
                    <button
                      class="text-xs px-2 py-0.5 rounded-md font-medium transition-all"
                      style="background: var(--info-bg); color: var(--focus-ring);"
                      @click="copyQrUrl"
                    >{{ qrCopied ? __('✓ Copied') : __('Copy URL') }}</button>
                  </div>
                </div>

                <!-- Last scanned feedback -->
                <Transition name="card-rise">
                  <div
                    v-if="qrLastScanned"
                    class="w-full flex items-center gap-2 px-3 py-2 rounded-lg"
                    style="background: #f0fdf4; border: 1px solid #bbf7d0;"
                  >
                    <svg class="w-4 h-4 text-green-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                    <div class="min-w-0">
                      <p class="text-xs font-semibold text-green-700 truncate">{{ qrLastScanned.barcode }}</p>
                      <p class="text-xs text-green-600">{{ __('Added to cart ✓') }}</p>
                    </div>
                  </div>
                </Transition>

                <!-- Steps -->
                <ol class="w-full space-y-1.5">
                  <li
                    v-for="(step, i) in qrSteps"
                    :key="i"
                    class="flex items-start gap-2 text-xs"
                    style="color: var(--text-muted);"
                  >
                    <span
                      class="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold mt-px"
                      style="background: var(--info-bg); color: var(--focus-ring);"
                    >{{ i + 1 }}</span>
                    {{ __(step) }}
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>

    <!-- ══ TOAST ══ -->
    <Transition name="toast-pop">
      <div
        v-if="toast && modelValue"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-[10px] z-[10000] shadow-xl pointer-events-none min-w-[260px] max-w-[90vw]"
        :class="{
          'bg-green-50 border border-green-200':  toast.type === 'success',
          'bg-red-50   border border-red-200':    toast.type === 'error',
          'bg-amber-50 border border-amber-200':  toast.type === 'warning',
        }"
      >
        <span class="text-lg flex-shrink-0">{{ toast.icon }}</span>
        <div class="flex-1 min-w-0">
          <div
            class="text-[13px] font-semibold truncate"
            :class="{
              'text-green-800': toast.type === 'success',
              'text-red-800':   toast.type === 'error',
              'text-amber-800': toast.type === 'warning',
            }"
          >{{ toast.title }}</div>
          <div v-if="toast.sub" class="text-[11px] text-gray-500 mt-0.5 truncate">{{ toast.sub }}</div>
        </div>
        <span
          v-if="toast.scanType"
          class="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
          style="background: var(--info-bg); color: var(--focus-ring);"
        >{{ typeLabels[toast.scanType] }}</span>
      </div>
    </Transition>

  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onUnmounted, reactive } from 'vue'
import { useShiftStore } from '@/stores/shift'
import { useMobileScanSession } from '@/services/useMobileScanSession'

// ── QR Session (Phone tab) ─────────────────────────────────────────
const {
  sessionId,
  isListening,
  lastScanned: qrLastScanned,
  pairingConfirmed,
  startListening,
  stopListening,
  getScannerUrl,
} = useMobileScanSession()

const activeTab    = ref('camera')   // 'camera' | 'phone'
const qrCanvas     = ref(null)
const qrCopied     = ref(false)

const qrSteps = [
  'Open your phone camera or QR reader',
  'Scan the QR code above',
  'The scanner page opens in your browser',
  'Scan product barcodes – cart updates instantly',
]

const generateQR = async () => {
  await nextTick()
  if (!qrCanvas.value) return
  try {
    let QRCode
    try { QRCode = (await import('qrcode')).default }
    catch { renderQRFallback(); return }
    const url = getScannerUrl()
    await QRCode.toCanvas(qrCanvas.value, url, {
      width: 220, margin: 1,
      color: { dark: '#0f172a', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
  } catch { renderQRFallback() }
}

const renderQRFallback = () => {
  const url    = getScannerUrl()
  const apiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(url)}&color=0f172a&bgcolor=ffffff`
  const canvas = qrCanvas.value
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  canvas.width = 220; canvas.height = 220
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => ctx.drawImage(img, 0, 0, 220, 220)
  img.onerror = () => {
    ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, 220, 220)
    ctx.fillStyle = '#475569'; ctx.font = '11px monospace'
    ctx.fillText('QR Error – copy URL below', 8, 110)
  }
  img.src = apiUrl
}

const copyQrUrl = async () => {
  try { await navigator.clipboard.writeText(getScannerUrl()) }
  catch {
    const el = document.createElement('textarea')
    el.value = getScannerUrl(); document.body.appendChild(el)
    el.select(); document.execCommand('copy'); document.body.removeChild(el)
  }
  qrCopied.value = true
  setTimeout(() => { qrCopied.value = false }, 2000)
}

watch(activeTab, (tab) => {
  if (tab === 'phone') { startListening(); generateQR() }
  else { stopListening() }
})

watch(pairingConfirmed, (val) => {
  if (val) { activeTab.value = 'camera'; stopListening() }
})



const props = defineProps({
  modelValue:  { type: Boolean,  default: false },
  onAddToCart: { type: Function, required: true },
  posProfile:  { type: Object,   default: () => ({}) },
  priceList:   { type: String,   default: '' },
  warehouse:   { type: String,   default: '' },
  customer:    { type: String,   default: '' },
})
const emit = defineEmits(['update:modelValue'])
const close = () => { stopScanner(); emit('update:modelValue', false) }

const shiftStore = useShiftStore()

// ── State ──────────────────────────────────────────────────────────
const fastMode       = ref(true)
const isScanning     = ref(false)
const cameraError    = ref('')
const isResolving    = ref(false)
const manualInput    = ref('')
const manualInputRef = ref(null)
const scannerEl      = ref(null)
const socketStatus   = ref('connecting')
const scanHistory    = ref([])
const pendingConfirm = ref(null)
const resolvedType   = ref('')
const toast          = ref(null)
let   toastTimer     = null
let   resolvedTypeTimer = null

// ── Type metadata ──────────────────────────────────────────────────
const typeLabels = { serial: 'Serial No', batch: 'Batch No', barcode: 'Barcode', text: 'Item Search' }
const typeStyles = { serial: { icon: '🔖' }, batch: { icon: '📦' }, barcode: { icon: '▐▌' }, text: { icon: '🔍' } }

// accent colors per type — used inline since Tailwind can't dynamic-class these
const typeAccent = { serial: '#7c3aed', batch: '#d97706', barcode: 'var(--focus-ring)', text: 'var(--focus-ring)' }
const typeBadgeStyle = {
  serial:  'color: #7c3aed; border: 1px solid #ddd6fe;',
  batch:   'color: #d97706; border: 1px solid #fde68a;',
  barcode: 'color: var(--focus-ring); border: 1px solid var(--focus-ring);',
  text:    'color: var(--text-muted); border: 1px solid var(--card-border);',
}

// ── Computed ───────────────────────────────────────────────────────
const addedCount    = computed(() => scanHistory.value.filter(i => i.found && !i.pending).length)
const notFoundCount = computed(() => scanHistory.value.filter(i => !i.found && !i.pending).length)
const statusText    = computed(() => ({ connected: 'Connected', connecting: 'Connecting…', error: 'Error' })[socketStatus.value] || '')

// ── Debounce ───────────────────────────────────────────────────────
let lastScanned = ''; let lastScannedTime = 0
const DEBOUNCE_MS = 700


// ── Auto-scan on input ──────────────────────────────────────
watch(manualInput,async (val) => {
  console.log("manualInput changed to:",val)
   if (val && fastMode.value) {
    console.log("Start scanning...", fastMode.value)
    await processValue(val)

  }
})

// ── Resolve via backend ────────────────────────────────────────────
const resolveValue = async (rawValue) => {
  if (!rawValue?.trim()) return { found: false }
  socketStatus.value = 'connecting'
  try {
    const result = await shiftStore.getItemsFromFrappeDB(
      props.posProfile,
      props.priceList || props.posProfile?.selling_price_list,
      props.posProfile?.customer || props.customer,
      rawValue.trim(),
      props.warehouse || props.posProfile?.warehouse,
    )
    socketStatus.value = 'connected'
    const context = result?.search_context || {}
    const items   = result?.items || []
    if (!context.type || context.type === 'text' || !context.item_code) {
      if (items.length === 1) return { found: true, item: items[0], context: { type: 'text', item_code: items[0].item_code, ...context } }
      return { found: false, context }
    }
    const matchedItem = items.find(i => i.item_code === context.item_code) || items[0]
    if (!matchedItem) return { found: false, context }
    return { found: true, item: matchedItem, context }
  } catch (err) {
    console.error('[MobileScanOverlay]', err)
    socketStatus.value = 'error'
    return { found: false, error: err?.message }
  }
}

const buildCartMeta = (item, context) => {
  const meta = { scan_type: context.type, item_code: context.item_code || item.item_code }
  if (context.serial_no) meta.serial_no = context.serial_no
  if (context.batch_no)  meta.batch_no  = context.batch_no
  if (context.uom)       meta.uom       = context.uom
  if (context.barcode)   meta.barcode   = context.barcode
  return meta
}

const processValue = async (rawValue) => {
  if (isResolving.value) return
  isResolving.value = true
  resolvedType.value = ''

  const { found, item, context, error } = await resolveValue(rawValue)
  isResolving.value = false

  const timeStr = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

  if (!found) {
    scanHistory.value.unshift({ id: Date.now(), rawValue, found: false, pending: false, type: null, item_code: '', item_name: '', time: timeStr })
    vibrateError()
    showToast({ type: 'error', icon: '✗', title: `Not found: ${rawValue}`, sub: error || 'No match in catalog' })
    return
  }

  resolvedType.value = context.type
  clearTimeout(resolvedTypeTimer)
  resolvedTypeTimer = setTimeout(() => { resolvedType.value = '' }, 2000)

  const historyEntry = reactive({
    id: Date.now(), rawValue, found: true, pending: false,
    type: context.type, item_code: item.item_code, item_name: item.item_name || item.item_code,
    serial_no: context.serial_no || '', batch_no: context.batch_no || '', time: timeStr,
  })

  if (fastMode.value) {
    scanHistory.value.unshift(historyEntry)
    if (scanHistory.value.length > 30) scanHistory.value.pop()
    props.onAddToCart(
      { ...item, uom: context.uom || item.uom || item.stock_uom, serial_no: context.serial_no || '', batch_no: context.batch_no || '', barcode: context.barcode || '', qty: 1 },
      buildCartMeta(item, context)
    )
    vibrateSuccess(); beepSuccess()
    showToast({
      type: 'success', icon: typeStyles[context.type]?.icon || '✓',
      title: item.item_name || item.item_code,
      sub: context.serial_no ? `S/N: ${context.serial_no}` : context.batch_no ? `Batch: ${context.batch_no}` : context.barcode || '',
      scanType: context.type,
    })
    return
  }

  pendingConfirm.value = {
    ...item, type: context.type,
    serial_no: context.serial_no || '', batch_no: context.batch_no || '',
    uom: context.uom || item.uom || item.stock_uom || '',
    _context: context, _entry: historyEntry,
  }
}

const confirmAdd = () => {
  if (!pendingConfirm.value) return
  const { _context, _entry, ...item } = pendingConfirm.value
  props.onAddToCart({ ...item, qty: 1 }, buildCartMeta(item, _context))
  scanHistory.value.unshift(_entry)
  if (scanHistory.value.length > 30) scanHistory.value.pop()
  vibrateSuccess(); beepSuccess()
  showToast({ type: 'success', icon: '✓', title: item.item_name || item.item_code, scanType: _context.type })
  pendingConfirm.value = null
  nextTick(() => startScanner())
}

const cancelConfirm = () => {
  pendingConfirm.value = null
  nextTick(() => startScanner())
}

const submitManual = async () => {
  const val = manualInput.value.trim()
  if (!val) return
  manualInput.value = ''
  await processValue(val)
}

// ── Quagga ─────────────────────────────────────────────────────────
const onBarcodeDetected = async (result) => {
  const barcode = result?.codeResult?.code
  if (!barcode) return
  const now = Date.now()
  if (barcode === lastScanned && now - lastScannedTime < DEBOUNCE_MS) return
  lastScanned = barcode; lastScannedTime = now
  await processValue(barcode)
}

const loadQuagga = () => new Promise((resolve, reject) => {
  if (window.Quagga) { resolve(); return }
  const s = document.createElement('script')
  s.src = 'https://cdn.jsdelivr.net/npm/quagga@0.12.1/dist/quagga.min.js'
  s.onload = resolve; s.onerror = () => reject(new Error('Failed to load QuaggaJS'))
  document.head.appendChild(s)
})

const startScanner = async () => {
  cameraError.value = ''
  if (!scannerEl.value) return
  try {
    await loadQuagga(); await nextTick()
    // eslint-disable-next-line no-undef
    Quagga.init({
      inputStream: {
        name: 'Live', type: 'LiveStream', target: scannerEl.value,
        constraints: { width: { ideal: fastMode.value ? 640 : 1280 }, height: { ideal: fastMode.value ? 480 : 720 }, facingMode: 'environment' },
      },
      decoder: { readers: ['ean_reader','ean_8_reader','code_128_reader','code_39_reader','upc_reader','upc_e_reader'], multiple: false },
      locate: true, numOfWorkers: navigator.hardwareConcurrency || 4, frequency: fastMode.value ? 15 : 10,
    }, (err) => {
      if (err) { cameraError.value = err.message || 'Camera access denied'; isScanning.value = false; return }
      // eslint-disable-next-line no-undef
      Quagga.start(); isScanning.value = true; socketStatus.value = 'connected'
    })
    // eslint-disable-next-line no-undef
    Quagga.onDetected(onBarcodeDetected)
  } catch (err) { cameraError.value = err.message }
}

const stopScanner = () => {
  if (!window.Quagga) return
  try { window.Quagga.stop() } catch { /* stopped */ }
  isScanning.value = false
}

// ── Audio + haptic ──────────────────────────────────────────────────
const beepSuccess = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator(); const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.value = 1046
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.12)
  } catch { /* ignore */ }
}
const vibrateSuccess = () => navigator.vibrate?.([60])
const vibrateError   = () => navigator.vibrate?.([80, 40, 80])

const showToast = (opts) => {
  toast.value = opts
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 2000)
}

// ── Lifecycle ───────────────────────────────────────────────────────
watch(() => props.modelValue, (val) => {
  if (val) {
    setTimeout(() => { startScanner(); nextTick(() => manualInputRef.value?.focus()) }, 300)
  } else {
    stopScanner();  stopListening()
    pendingConfirm.value = null
    toast.value = null; resolvedType.value = ''; manualInput.value = ''
    activeTab.value = 'camera'   // reset tab to camera
  }
})

onUnmounted(() => {
  stopScanner()
  stopListening()
  clearTimeout(toastTimer)
  clearTimeout(resolvedTypeTimer)
})
</script>

<style scoped>
/* QR scan line */
.qr-scan-line {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--focus-ring), transparent);
  animation: beam 2s linear infinite;
  border-radius: 1px;
}

/* Quagga */
:deep(.scanner-target video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
}
:deep(.scanner-target canvas) { display: none !important; }

/* Scan beam */
.scan-beam {
  background: linear-gradient(to right, transparent, var(--focus-ring), transparent);
  animation: beam 2.5s ease-in-out infinite;
}

/* Spinner */
.bu-spinner {
  display: inline-block;
  width: 12px; height: 12px;
  border: 2px solid rgba(255,255,255,.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: bu-spin .6s linear infinite;
}

@keyframes beam {
  0%   { top: 10%; opacity: 0; }
  5%   { opacity: 1; }
  95%  { opacity: 1; }
  100% { top: 90%; opacity: 0; }
}
@keyframes bu-spin { to { transform: rotate(360deg); } }

/* Transitions */
.bu-overlay-enter-active,
.bu-overlay-leave-active  { transition: opacity .2s ease; }
.bu-overlay-enter-from,
.bu-overlay-leave-to      { opacity: 0; }

.bu-dialog-enter-active,
.bu-dialog-leave-active   { transition: opacity .2s ease, transform .22s ease; }
.bu-dialog-enter-from,
.bu-dialog-leave-to       { opacity: 0; transform: scale(.97) translateY(8px); }

.badge-pop-enter-active   { transition: all .2s cubic-bezier(.34,1.56,.64,1); }
.badge-pop-enter-from     { opacity: 0; transform: translateX(-50%) scale(.8); }
.badge-pop-leave-active   { transition: all .15s ease-in; }
.badge-pop-leave-to       { opacity: 0; transform: translateX(-50%) scale(.9); }

.card-rise-enter-active   { transition: all .2s ease-out; }
.card-rise-enter-from     { opacity: 0; transform: translateY(8px); }
.card-rise-leave-active   { transition: all .15s ease-in; }
.card-rise-leave-to       { opacity: 0; transform: translateY(4px); }

.scan-list-enter-active   { transition: all .2s ease; }
.scan-list-enter-from     { opacity: 0; transform: translateY(-5px); }

.toast-pop-enter-active   { transition: all .18s cubic-bezier(.34,1.56,.64,1); }
.toast-pop-enter-from     { opacity: 0; transform: translateX(-50%) translateY(10px) scale(.96); }
.toast-pop-leave-active   { transition: all .18s ease-in; }
.toast-pop-leave-to       { opacity: 0; transform: translateX(-50%) translateY(6px); }

/* Mobile: stack layout */
@media (max-width: 640px) {
  .scan-left-col  { width: 100% !important; border-right: none !important; border-bottom: 1px solid var(--card-border); }
  .scan-right-col { display: none; }
}
</style>
