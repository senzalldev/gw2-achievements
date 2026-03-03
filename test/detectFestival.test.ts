import { describe, it, expect } from 'vitest'
import { detectFestival } from '../src/composables/useAchievements'

describe('detectFestival', () => {
  // Exact group/category name match
  it('returns Halloween for exact group name match', () => {
    expect(detectFestival('Halloween', null)).toBe('Halloween')
  })

  it('returns Wintersday for exact group name match', () => {
    expect(detectFestival('Wintersday', null)).toBe('Wintersday')
  })

  it('returns Super Adventure Box for exact category name match', () => {
    expect(detectFestival(null, 'Super Adventure Box')).toBe('Super Adventure Box')
  })

  // Starts-with match (category name starts with festival name + space or colon)
  it('returns Dragon Bash for category starting with "Dragon Bash "', () => {
    expect(detectFestival('Historical', 'Dragon Bash Feats')).toBe('Dragon Bash')
  })

  it('returns Halloween for category starting with "Halloween "', () => {
    expect(detectFestival('Historical', 'Halloween Rituals')).toBe('Halloween')
  })

  it('returns Lunar New Year for category starting with "Lunar New Year "', () => {
    expect(detectFestival('Historical', 'Lunar New Year Festivities')).toBe('Lunar New Year')
  })

  it('returns Super Adventure Box for category starting with "Super Adventure Box:"', () => {
    expect(detectFestival('Historical', 'Super Adventure Box: Nostalgia')).toBe('Super Adventure Box')
  })

  // Keyword fallback for names that don't share the festival name directly
  it('returns Halloween for "Shadow of the Mad King" (keyword fallback)', () => {
    expect(detectFestival(null, 'Shadow of the Mad King')).toBe('Halloween')
  })

  it('returns Lunar New Year for "New Year\'s Customs" (keyword fallback)', () => {
    expect(detectFestival(null, "New Year's Customs")).toBe('Lunar New Year')
  })

  it('returns Festival of the Four Winds for "Four Winds Customs" (keyword fallback)', () => {
    expect(detectFestival(null, 'Four Winds Customs')).toBe('Festival of the Four Winds')
  })

  it('returns Wintersday for "Bell Choir Ensemble" (keyword fallback)', () => {
    expect(detectFestival(null, 'Bell Choir Ensemble')).toBe('Wintersday')
  })

  it('returns Halloween for "Blood and Madness" (keyword fallback)', () => {
    expect(detectFestival(null, 'Blood and Madness')).toBe('Halloween')
  })

  // Null / unknown → null
  it('returns null for null/null', () => {
    expect(detectFestival(null, null)).toBeNull()
  })

  it('returns null for unknown group and category', () => {
    expect(detectFestival('General', 'General')).toBeNull()
  })

  it('returns null for World vs. World (not a festival)', () => {
    expect(detectFestival('World vs. World', null)).toBeNull()
  })

  it('returns null for undefined inputs', () => {
    expect(detectFestival(undefined, undefined)).toBeNull()
  })
})
