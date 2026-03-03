/**
 * filterPipeline.test.ts
 *
 * Tests for the full filter pipeline:
 *   1. detectFestival — canonical name returned for real GW2 group/category names
 *   2. statsFilterFn  — mode-only filter (festivals do NOT affect AP totals/stats)
 *   3. listFilterFn   — mode + per-festival filter (used by Almost Done, Most Valuable,
 *                       Categories, Goals, Browse All)
 *   4. Consistency    — FESTIVALS list in useContentFilter aligns with detectFestival output
 *
 * The filter functions are reimplemented here as pure functions (no Vue reactivity /
 * localStorage) to mirror the exact logic in useContentFilter.ts without test side-effects.
 */

import { describe, it, expect } from 'vitest'
import { detectFestival, classifyMode } from '../src/composables/useAchievements'
import { FESTIVALS } from '../src/composables/useContentFilter'
import type { EnrichedAchievement } from '../src/composables/useAchievements'
import type { AchievementDetail } from '../src/types/gw2'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeDetail(overrides: Partial<AchievementDetail> = {}): AchievementDetail {
  return {
    id: 1, name: 'Test', description: '', requirement: '',
    type: 'Default', flags: [], tiers: [],
    ...overrides,
  }
}

function makeEnriched(overrides: Partial<EnrichedAchievement> = {}): EnrichedAchievement {
  return {
    account:        { id: 1, done: false },
    detail:         makeDetail(),
    category:       null,
    group:          null,
    festivalName:   null,
    mode:           'pve',
    progressPercent: 0,
    earnedPoints:   0,
    totalPoints:    10,
    ...overrides,
  }
}

// Pure reimplementation of statsFilterFn / listFilterFn from useContentFilter.ts.
// Mirrors the exact logic without Vue reactivity so tests have no side-effects.
const FESTIVAL_ALIASES: Record<string, string> = {
  'Super Adventure Festival': 'Super Adventure Box',
  'Bazaar of the Four Winds': 'Festival of the Four Winds',
  "Queen's Jubilee":          'Festival of the Four Winds',
}

function buildFilters(opts: {
  pvp?: boolean
  wvw?: boolean
  hom?: boolean
  festivals?: Partial<Record<string, boolean>>
}) {
  const pvp = opts.pvp ?? true
  const wvw = opts.wvw ?? true
  const hom = opts.hom ?? true
  const fests: Record<string, boolean> = Object.fromEntries(
    FESTIVALS.map(f => [f.name, true])
  )
  Object.assign(fests, opts.festivals ?? {})

  function statsFilter(a: EnrichedAchievement): boolean {
    if (a.mode === 'pvp' && !pvp) return false
    if (a.mode === 'wvw' && !wvw) return false
    if (a.mode === 'hom' && !hom) return false
    return true
  }

  function listFilter(a: EnrichedAchievement): boolean {
    if (!statsFilter(a)) return false
    if (a.mode === 'festival' && a.festivalName) {
      const canonical = FESTIVAL_ALIASES[a.festivalName] ?? a.festivalName
      if (canonical in fests && !fests[canonical]) return false
    }
    return true
  }

  return { statsFilter, listFilter }
}

// ---------------------------------------------------------------------------
// 1. FESTIVALS list ↔ detectFestival consistency
// ---------------------------------------------------------------------------

describe('FESTIVALS list aligns with detectFestival', () => {
  it('every FESTIVALS entry name is returned verbatim by detectFestival(name, null)', () => {
    // If this breaks, useContentFilter's festivalRefs keys won't match festivalName values
    // and no achievement will ever be filtered by that festival toggle.
    for (const f of FESTIVALS) {
      expect(detectFestival(f.name, null)).toBe(f.name)
    }
  })

  it('FESTIVALS has exactly 6 entries (one per known GW2 seasonal event)', () => {
    expect(FESTIVALS).toHaveLength(6)
  })

  it('all 6 canonical festival names are present in FESTIVALS', () => {
    const names = FESTIVALS.map(f => f.name)
    expect(names).toContain('Halloween')
    expect(names).toContain('Wintersday')
    expect(names).toContain('Dragon Bash')
    expect(names).toContain('Lunar New Year')
    expect(names).toContain('Festival of the Four Winds')
    expect(names).toContain('Super Adventure Box')
  })
})

// ---------------------------------------------------------------------------
// 2. detectFestival — realistic GW2 group / category names
// ---------------------------------------------------------------------------

describe('detectFestival — Halloween', () => {
  it('exact group match: "Halloween"', () =>
    expect(detectFestival('Halloween', null)).toBe('Halloween'))
  it('category keyword: "Shadow of the Mad King"', () =>
    expect(detectFestival(null, 'Shadow of the Mad King')).toBe('Halloween'))
  it('category keyword: "Blood and Madness"', () =>
    expect(detectFestival(null, 'Blood and Madness')).toBe('Halloween'))
  it('category starts-with: "Halloween Events"', () =>
    expect(detectFestival(null, 'Halloween Events')).toBe('Halloween'))
  it('category starts-with: "Halloween Rituals"', () =>
    expect(detectFestival(null, 'Halloween Rituals')).toBe('Halloween'))
  it('keyword: "Mad King Says"', () =>
    expect(detectFestival(null, 'Mad King Says')).toBe('Halloween'))
  it('keyword: "Lunatic Inquisition"', () =>
    expect(detectFestival(null, 'Lunatic Inquisition')).toBe('Halloween'))
})

describe('detectFestival — Wintersday', () => {
  it('exact group match: "Wintersday"', () =>
    expect(detectFestival('Wintersday', null)).toBe('Wintersday'))
  it('category starts-with: "Wintersday Celebrations"', () =>
    expect(detectFestival(null, 'Wintersday Celebrations')).toBe('Wintersday'))
  it('keyword: "Bell Choir Ensemble"', () =>
    expect(detectFestival(null, 'Bell Choir Ensemble')).toBe('Wintersday'))
  it('keyword: "Winter Wonderland"', () =>
    expect(detectFestival(null, 'Winter Wonderland')).toBe('Wintersday'))
  it('keyword: "Toypocalypse"', () =>
    expect(detectFestival(null, 'Toypocalypse')).toBe('Wintersday'))
  it('keyword: "Snowball Mayhem"', () =>
    expect(detectFestival(null, 'Snowball Mayhem')).toBe('Wintersday'))
})

describe('detectFestival — Dragon Bash', () => {
  it('exact group match: "Dragon Bash"', () =>
    expect(detectFestival('Dragon Bash', null)).toBe('Dragon Bash'))
  it('category starts-with: "Dragon Bash Activities"', () =>
    expect(detectFestival(null, 'Dragon Bash Activities')).toBe('Dragon Bash'))
  it('keyword: "Dragon Ball"', () =>
    expect(detectFestival(null, 'Dragon Ball')).toBe('Dragon Bash'))
  it('category starts-with: "Dragon Bash Feats"', () =>
    expect(detectFestival('Historical', 'Dragon Bash Feats')).toBe('Dragon Bash'))
})

describe('detectFestival — Lunar New Year', () => {
  it('exact group match: "Lunar New Year"', () =>
    expect(detectFestival('Lunar New Year', null)).toBe('Lunar New Year'))
  it('category starts-with: "Lunar New Year Festivities"', () =>
    expect(detectFestival(null, 'Lunar New Year Festivities')).toBe('Lunar New Year'))
  it("keyword: \"New Year's Customs\"", () =>
    expect(detectFestival(null, "New Year's Customs")).toBe('Lunar New Year'))
  it('keyword: "Lucky Envelope"', () =>
    expect(detectFestival(null, 'Lucky Envelope Activities')).toBe('Lunar New Year'))
  it('keyword: "Red Lantern"', () =>
    expect(detectFestival(null, 'Red Lantern Run')).toBe('Lunar New Year'))
  it('keyword: "Celestial Challenge"', () =>
    expect(detectFestival(null, 'Celestial Challenge')).toBe('Lunar New Year'))
})

describe('detectFestival — Festival of the Four Winds', () => {
  it('exact group match: "Festival of the Four Winds"', () =>
    expect(detectFestival('Festival of the Four Winds', null)).toBe('Festival of the Four Winds'))
  it('category starts-with: "Festival of the Four Winds Activities"', () =>
    expect(detectFestival(null, 'Festival of the Four Winds Activities')).toBe('Festival of the Four Winds'))
  it('keyword: "Four Winds"', () =>
    expect(detectFestival(null, 'Four Winds Customs')).toBe('Festival of the Four Winds'))
  it('keyword: "Bazaar"', () =>
    expect(detectFestival(null, 'Bazaar of the Four Winds')).toBe('Festival of the Four Winds'))
  it('keyword: "Crown Pavilion"', () =>
    expect(detectFestival(null, 'Crown Pavilion Events')).toBe('Festival of the Four Winds'))
  it('keyword: "Boss Blitz"', () =>
    expect(detectFestival(null, 'Boss Blitz')).toBe('Festival of the Four Winds'))
  it('keyword: "Zephyrite"', () =>
    expect(detectFestival(null, 'Zephyrite Traditions')).toBe('Festival of the Four Winds'))
})

describe('detectFestival — Super Adventure Box', () => {
  it('exact category match: "Super Adventure Box"', () =>
    expect(detectFestival(null, 'Super Adventure Box')).toBe('Super Adventure Box'))
  it('category starts-with: "Super Adventure Box: World 1"', () =>
    expect(detectFestival(null, 'Super Adventure Box: World 1')).toBe('Super Adventure Box'))
  it('category starts-with: "Super Adventure Box: Nostalgia"', () =>
    expect(detectFestival(null, 'Super Adventure Box: Nostalgia')).toBe('Super Adventure Box'))
  it('keyword fallback: "Super Adventure Festival" (legacy API name)', () =>
    expect(detectFestival(null, 'Super Adventure Festival')).toBe('Super Adventure Box'))
  it('keyword: category contains "super adventure"', () =>
    expect(detectFestival('Historical', 'Super Adventure Box Activities')).toBe('Super Adventure Box'))
})

describe('detectFestival — non-festivals return null', () => {
  it('returns null for general PvE', () =>
    expect(detectFestival('General', null)).toBeNull())
  it('returns null for World vs. World', () =>
    expect(detectFestival('World vs. World', null)).toBeNull())
  it('returns null for Player vs. Player', () =>
    expect(detectFestival('Player vs. Player', null)).toBeNull())
  it('returns null for Story Journal', () =>
    expect(detectFestival('Story Journal', 'Living World')).toBeNull())
  it('returns null for Hall of Monuments', () =>
    expect(detectFestival('Hall of Monuments', null)).toBeNull())
  it('returns null for null/null', () =>
    expect(detectFestival(null, null)).toBeNull())
})

// ---------------------------------------------------------------------------
// 3. classifyMode — festival mode assignment
// ---------------------------------------------------------------------------

describe('classifyMode — festival mode', () => {
  it('assigns festival to Halloween group', () =>
    expect(classifyMode([], 'Halloween', null)).toBe('festival'))
  it('assigns festival to Wintersday group', () =>
    expect(classifyMode([], 'Wintersday', null)).toBe('festival'))
  it('assigns festival to Dragon Bash group', () =>
    expect(classifyMode([], 'Dragon Bash', null)).toBe('festival'))
  it('assigns festival to Lunar New Year group', () =>
    expect(classifyMode([], 'Lunar New Year', null)).toBe('festival'))
  it('assigns festival to Festival of the Four Winds group', () =>
    expect(classifyMode([], 'Festival of the Four Winds', null)).toBe('festival'))
  it('assigns festival to SAB category', () =>
    expect(classifyMode([], 'Historical', 'Super Adventure Box')).toBe('festival'))
  it('assigns festival to SAB sub-category', () =>
    expect(classifyMode([], 'Historical', 'Super Adventure Box: World 1')).toBe('festival'))
  it('assigns festival to Shadow of the Mad King', () =>
    expect(classifyMode([], null, 'Shadow of the Mad King')).toBe('festival'))
})

// ---------------------------------------------------------------------------
// 4. statsFilterFn — mode-only (festivals NEVER affect AP totals/stats cards)
// ---------------------------------------------------------------------------

describe('statsFilterFn — modes only, festivals are ignored', () => {
  it('includes festival achievements regardless of any festival toggle', () => {
    for (const f of FESTIVALS) {
      const { statsFilter } = buildFilters({ festivals: { [f.name]: false } })
      const a = makeEnriched({ mode: 'festival', festivalName: f.name })
      expect(statsFilter(a), `${f.name} should still pass stats filter`).toBe(true)
    }
  })

  it('includes all 6 festivals when all festival toggles are off', () => {
    const allOff = Object.fromEntries(FESTIVALS.map(f => [f.name, false]))
    const { statsFilter } = buildFilters({ festivals: allOff })
    for (const f of FESTIVALS) {
      const a = makeEnriched({ mode: 'festival', festivalName: f.name })
      expect(statsFilter(a)).toBe(true)
    }
  })

  it('excludes pvp when pvp=false', () => {
    const { statsFilter } = buildFilters({ pvp: false })
    expect(statsFilter(makeEnriched({ mode: 'pvp' }))).toBe(false)
  })

  it('still includes pve, wvw, hom, festival when pvp=false', () => {
    const { statsFilter } = buildFilters({ pvp: false })
    expect(statsFilter(makeEnriched({ mode: 'pve' }))).toBe(true)
    expect(statsFilter(makeEnriched({ mode: 'wvw' }))).toBe(true)
    expect(statsFilter(makeEnriched({ mode: 'hom' }))).toBe(true)
    expect(statsFilter(makeEnriched({ mode: 'festival', festivalName: 'Halloween' }))).toBe(true)
  })

  it('excludes wvw when wvw=false', () => {
    const { statsFilter } = buildFilters({ wvw: false })
    expect(statsFilter(makeEnriched({ mode: 'wvw' }))).toBe(false)
    expect(statsFilter(makeEnriched({ mode: 'pve' }))).toBe(true)
  })

  it('excludes hom when hom=false', () => {
    const { statsFilter } = buildFilters({ hom: false })
    expect(statsFilter(makeEnriched({ mode: 'hom' }))).toBe(false)
    expect(statsFilter(makeEnriched({ mode: 'pve' }))).toBe(true)
  })

  it('includes everything when all toggles are on', () => {
    const { statsFilter } = buildFilters({})
    for (const mode of ['pve', 'pvp', 'wvw', 'hom', 'festival'] as const) {
      expect(statsFilter(makeEnriched({ mode }))).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// 5. listFilterFn — mode + per-festival (used by Almost Done, Most Valuable, etc.)
// ---------------------------------------------------------------------------

describe('listFilterFn — each festival can be individually toggled off', () => {
  for (const festival of FESTIVALS) {
    it(`hides ${festival.name} achievements when that festival is toggled off`, () => {
      const { listFilter } = buildFilters({ festivals: { [festival.name]: false } })
      const a = makeEnriched({ mode: 'festival', festivalName: festival.name })
      expect(listFilter(a)).toBe(false)
    })

    it(`shows ${festival.name} achievements when that festival is toggled on`, () => {
      const { listFilter } = buildFilters({})
      const a = makeEnriched({ mode: 'festival', festivalName: festival.name })
      expect(listFilter(a)).toBe(true)
    })

    it(`toggling off ${festival.name} does not hide other festivals`, () => {
      const { listFilter } = buildFilters({ festivals: { [festival.name]: false } })
      for (const other of FESTIVALS.filter(f => f.name !== festival.name)) {
        const a = makeEnriched({ mode: 'festival', festivalName: other.name })
        expect(listFilter(a), `${other.name} should still be visible`).toBe(true)
      }
    })
  }
})

describe('listFilterFn — safety guards and edge cases', () => {
  it('includes festival achievement with festivalName=null even when all festivals are off', () => {
    const allOff = Object.fromEntries(FESTIVALS.map(f => [f.name, false]))
    const { listFilter } = buildFilters({ festivals: allOff })
    // If festivalName is null we can't determine which festival, so we don't hide it
    expect(listFilter(makeEnriched({ mode: 'festival', festivalName: null }))).toBe(true)
  })

  it('includes PvE achievements regardless of any festival toggle', () => {
    const allOff = Object.fromEntries(FESTIVALS.map(f => [f.name, false]))
    const { listFilter } = buildFilters({ festivals: allOff })
    expect(listFilter(makeEnriched({ mode: 'pve' }))).toBe(true)
  })

  it('excludes pvp from lists when pvp=false', () => {
    const { listFilter } = buildFilters({ pvp: false })
    expect(listFilter(makeEnriched({ mode: 'pvp' }))).toBe(false)
  })

  it('excludes wvw from lists when wvw=false', () => {
    const { listFilter } = buildFilters({ wvw: false })
    expect(listFilter(makeEnriched({ mode: 'wvw' }))).toBe(false)
  })

  it('excludes hom from lists when hom=false', () => {
    const { listFilter } = buildFilters({ hom: false })
    expect(listFilter(makeEnriched({ mode: 'hom' }))).toBe(false)
  })

  it('applies both mode and festival filters simultaneously', () => {
    const { listFilter } = buildFilters({ pvp: false, festivals: { 'Halloween': false } })
    expect(listFilter(makeEnriched({ mode: 'pvp' }))).toBe(false)
    expect(listFilter(makeEnriched({ mode: 'festival', festivalName: 'Halloween' }))).toBe(false)
    expect(listFilter(makeEnriched({ mode: 'pve' }))).toBe(true)
    expect(listFilter(makeEnriched({ mode: 'festival', festivalName: 'Wintersday' }))).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// 6. Page-level filter contract
// ---------------------------------------------------------------------------

describe('page filter contract — which filters affect which pages', () => {
  // statsFilter is used by: Overview (AP totals), My Stats (AP numbers)
  // listFilter is used by: Almost Done, Most Valuable, Categories, Goals, Browse All

  it('statsFilter and listFilter agree on PvE achievements', () => {
    const { statsFilter, listFilter } = buildFilters({ pvp: false, wvw: false })
    const pve = makeEnriched({ mode: 'pve' })
    expect(statsFilter(pve)).toBe(listFilter(pve))
  })

  it('statsFilter includes festivals that listFilter excludes (by design)', () => {
    const { statsFilter, listFilter } = buildFilters({ festivals: { 'Dragon Bash': false } })
    const dragon = makeEnriched({ mode: 'festival', festivalName: 'Dragon Bash' })
    // Stats (Overview AP, My Stats totals) → show
    expect(statsFilter(dragon)).toBe(true)
    // Lists (Almost Done, Most Valuable, Categories, Goals) → hide
    expect(listFilter(dragon)).toBe(false)
  })

  it('all 6 festivals: stats includes, list excludes when all festivals off', () => {
    const allOff = Object.fromEntries(FESTIVALS.map(f => [f.name, false]))
    const { statsFilter, listFilter } = buildFilters({ festivals: allOff })
    for (const f of FESTIVALS) {
      const a = makeEnriched({ mode: 'festival', festivalName: f.name })
      expect(statsFilter(a), `${f.name} stats`).toBe(true)
      expect(listFilter(a), `${f.name} list`).toBe(false)
    }
  })
})
