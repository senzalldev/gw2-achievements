import { ref, watch, computed } from 'vue'
import type { Ref } from 'vue'

function loadBool(key: string, def: boolean): boolean {
  const v = localStorage.getItem(key)
  return v === null ? def : v === '1'
}

function persistedRef(key: string, def: boolean) {
  const r = ref(loadBool(key, def))
  watch(r, v => localStorage.setItem(key, v ? '1' : '0'))
  return r
}

// Module-level (singleton) — same refs shared across any component that calls useContentFilter()
const includePvP  = persistedRef('gw2_filter_pvp', true)
const includeWvW  = persistedRef('gw2_filter_wvw', true)
const includeHoM  = persistedRef('gw2_filter_hom', true)

// One individual ref per festival — same proven pattern as PvP/WvW/HoM
const includeHalloween  = persistedRef('gw2_filter_fest_halloween',      true)
const includeWindersday = persistedRef('gw2_filter_fest_wintersday',     true)
const includeDragonBash = persistedRef('gw2_filter_fest_dragon_bash',    true)
const includeLunarNY    = persistedRef('gw2_filter_fest_lunar_new_year', true)
const includeFourWinds  = persistedRef('gw2_filter_fest_four_winds',     true)
const includeSAB        = persistedRef('gw2_filter_fest_super_adventure',true)

// Per-festival toggles shown in the UI
export const FESTIVALS = [
  { name: 'Halloween',                  icon: '🎃', key: 'halloween' },
  { name: 'Wintersday',                 icon: '⛄', key: 'wintersday' },
  { name: 'Dragon Bash',                icon: '🐲', key: 'dragon_bash' },
  { name: 'Lunar New Year',             icon: '🏮', key: 'lunar_new_year' },
  { name: 'Festival of the Four Winds', icon: '💨', key: 'four_winds' },
  { name: 'Super Adventure Box',        icon: '👾', key: 'super_adventure' },
] as const

// Legacy/alternate API category names mapped to the canonical festival name above
export const FESTIVAL_ALIASES: Record<string, string> = {
  'Super Adventure Festival': 'Super Adventure Box',
  'Bazaar of the Four Winds': 'Festival of the Four Winds',
  "Queen's Jubilee":          'Festival of the Four Winds',
}

// Map festival name → its ref, used by FilterBar for toggle/display
export const FESTIVAL_REFS: Record<string, Ref<boolean>> = {
  'Halloween':                  includeHalloween,
  'Wintersday':                 includeWindersday,
  'Dragon Bash':                includeDragonBash,
  'Lunar New Year':             includeLunarNY,
  'Festival of the Four Winds': includeFourWinds,
  'Super Adventure Box':        includeSAB,
}

export function useContentFilter() {
  // Each individual ref is read explicitly here — no loops, no callbacks.
  // This is the same pattern as includePvP/WvW/HoM and is reliable in Vue 3.5 alien-signals.
  // App.vue reads festivalsAllowed.value (one computed read) rather than each ref individually.
  const festivalsAllowed = computed<Record<string, boolean>>(() => ({
    'Halloween':                  includeHalloween.value,
    'Wintersday':                 includeWindersday.value,
    'Dragon Bash':                includeDragonBash.value,
    'Lunar New Year':             includeLunarNY.value,
    'Festival of the Four Winds': includeFourWinds.value,
    'Super Adventure Box':        includeSAB.value,
  }))

  const isFiltered = computed(() =>
    !includePvP.value ||
    !includeWvW.value ||
    !includeHoM.value ||
    !includeHalloween.value ||
    !includeWindersday.value ||
    !includeDragonBash.value ||
    !includeLunarNY.value ||
    !includeFourWinds.value ||
    !includeSAB.value
  )

  const isModeFiltered = computed(() =>
    !includePvP.value || !includeWvW.value || !includeHoM.value
  )

  return { includePvP, includeWvW, includeHoM, festivalsAllowed, isFiltered, isModeFiltered }
}
