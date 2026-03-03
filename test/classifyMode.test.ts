import { describe, it, expect } from 'vitest'
import { classifyMode } from '../src/composables/useAchievements'

describe('classifyMode', () => {
  // PvP flag takes priority
  it('returns pvp when flags includes "Pvp"', () => {
    expect(classifyMode(['Pvp'], null, null)).toBe('pvp')
  })

  it('returns pvp when flags includes "Pvp" regardless of group', () => {
    expect(classifyMode(['Pvp', 'CategoryDisplay'], 'General', 'Some Category')).toBe('pvp')
  })

  // Group name matches
  it('returns pvp for group "Player vs. Player"', () => {
    expect(classifyMode([], 'Player vs. Player', null)).toBe('pvp')
  })

  it('returns wvw for group "World vs. World"', () => {
    expect(classifyMode([], 'World vs. World', null)).toBe('wvw')
  })

  it('returns hom for group "Hall of Monuments"', () => {
    expect(classifyMode([], 'Hall of Monuments', null)).toBe('hom')
  })

  // Festival detection
  it('returns festival when category is a known festival', () => {
    expect(classifyMode([], 'Historical', 'Halloween Events')).toBe('festival')
  })

  it('returns festival for Halloween group', () => {
    expect(classifyMode([], 'Halloween', null)).toBe('festival')
  })

  it('returns festival for Dragon Bash category (starts-with)', () => {
    expect(classifyMode([], 'Historical', 'Dragon Bash Feats')).toBe('festival')
  })

  it('returns festival for Super Adventure Box: subcategory', () => {
    expect(classifyMode([], 'Historical', 'Super Adventure Box: Nostalgia')).toBe('festival')
  })

  it('returns festival for keyword-matched category "Shadow of the Mad King"', () => {
    expect(classifyMode([], null, 'Shadow of the Mad King')).toBe('festival')
  })

  // Default → pve
  it('returns pve for general achievements', () => {
    expect(classifyMode([], 'General', null)).toBe('pve')
  })

  it('returns pve for empty flags and unknown group', () => {
    expect(classifyMode([], 'Story Journal', 'Living World')).toBe('pve')
  })

  it('returns pve for empty flags and null inputs', () => {
    expect(classifyMode([], null, null)).toBe('pve')
  })
})
