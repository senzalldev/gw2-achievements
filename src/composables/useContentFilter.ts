import { ref, watch, computed } from 'vue'
import type { EnrichedAchievement } from './useAchievements'

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
const includePvP     = persistedRef('gw2_filter_pvp', true)
const includeWvW     = persistedRef('gw2_filter_wvw', true)
const includeHoM     = persistedRef('gw2_filter_hom', true)

// Per-festival toggles shown in the UI
export const FESTIVALS = [
  { name: 'Halloween',                  icon: '🎃', key: 'halloween' },
  { name: 'Wintersday',                 icon: '⛄', key: 'wintersday' },
  { name: 'Dragon Bash',                icon: '🐲', key: 'dragon_bash' },
  { name: 'Lunar New Year',             icon: '🏮', key: 'lunar_new_year' },
  { name: 'Festival of the Four Winds', icon: '💨', key: 'four_winds' },
  { name: 'Super Adventure Box',        icon: '👾', key: 'super_adventure' },
] as const

// Legacy/alternate API category names mapped to the canonical festival key above
const FESTIVAL_ALIASES: Record<string, string> = {
  'Super Adventure Festival': 'Super Adventure Box',
  'Bazaar of the Four Winds': 'Festival of the Four Winds',
  "Queen's Jubilee":          'Festival of the Four Winds',
}

// One ref per festival, keyed by canonical festival name
const festivalRefs = Object.fromEntries(
  FESTIVALS.map(f => [f.name, persistedRef(`gw2_filter_fest_${f.key}`, true)])
) as Record<string, ReturnType<typeof persistedRef>>

export function useContentFilter() {
  // statsFilterFn — PvP/WvW/HoM only. Used for AP totals, max AP, charts.
  // Festivals do NOT affect totals.
  const statsFilterFn = computed(() => (a: EnrichedAchievement): boolean => {
    if (a.mode === 'pvp' && !includePvP.value) return false
    if (a.mode === 'wvw' && !includeWvW.value) return false
    if (a.mode === 'hom' && !includeHoM.value) return false
    return true
  })

  // listFilterFn — everything including festivals. Used for lists (Almost Done, Most Valuable, etc.)
  const listFilterFn = computed(() => (a: EnrichedAchievement): boolean => {
    if (!statsFilterFn.value(a)) return false
    if (a.mode === 'festival' && a.festivalName) {
      const canonical = FESTIVAL_ALIASES[a.festivalName] ?? a.festivalName
      const r = festivalRefs[canonical]
      if (r && !r.value) return false
    }
    return true
  })

  const isFiltered = computed(() =>
    !includePvP.value ||
    !includeWvW.value ||
    !includeHoM.value ||
    Object.values(festivalRefs).some(r => !r.value)
  )

  const isModeFiltered = computed(() =>
    !includePvP.value || !includeWvW.value || !includeHoM.value
  )

  return { includePvP, includeWvW, includeHoM, festivalRefs, statsFilterFn, listFilterFn, isFiltered, isModeFiltered }
}
