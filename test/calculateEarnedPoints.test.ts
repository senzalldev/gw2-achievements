import { describe, it, expect } from 'vitest'
import { calculateEarnedPoints } from '../src/composables/useAchievements'
import type { AccountAchievement, AchievementDetail } from '../src/types/gw2'

function makeDetail(overrides: Partial<AchievementDetail> = {}): AchievementDetail {
  return {
    id: 1,
    name: 'Test Achievement',
    description: '',
    requirement: '',
    type: 'Default',
    flags: [],
    tiers: [{ count: 10, points: 10 }],
    ...overrides,
  }
}

function makeAccount(overrides: Partial<AccountAchievement> = {}): AccountAchievement {
  return { id: 1, done: false, ...overrides }
}

describe('calculateEarnedPoints', () => {
  // Not done, no progress → 0
  it('returns 0 when not done and no progress', () => {
    const account = makeAccount({ done: false, current: 0 })
    const detail = makeDetail({ tiers: [{ count: 10, points: 10 }] })
    expect(calculateEarnedPoints(account, detail)).toBe(0)
  })

  // Not done, partial progress → correct tier sum
  it('returns points for completed tiers when in progress', () => {
    const account = makeAccount({ done: false, current: 5 })
    const detail = makeDetail({
      tiers: [
        { count: 3, points: 2 },  // current=5 >= 3 → earned
        { count: 7, points: 5 },  // current=5 < 7 → not earned
        { count: 15, points: 8 }, // not earned
      ],
    })
    expect(calculateEarnedPoints(account, detail)).toBe(2)
  })

  it('returns sum of all completed tiers when past multiple thresholds', () => {
    const account = makeAccount({ done: false, current: 10 })
    const detail = makeDetail({
      tiers: [
        { count: 3, points: 2 },
        { count: 7, points: 5 },  // current=10 >= 7 → earned
        { count: 15, points: 8 }, // current=10 < 15 → not earned
      ],
    })
    expect(calculateEarnedPoints(account, detail)).toBe(7)
  })

  // Done, no point_cap → full tiers
  it('returns sum of all tier points when done with no cap', () => {
    const account = makeAccount({ done: true })
    const detail = makeDetail({
      tiers: [{ count: 1, points: 10 }, { count: 2, points: 20 }],
    })
    expect(calculateEarnedPoints(account, detail)).toBe(30)
  })

  // Done, with point_cap → capped at point_cap
  it('returns point_cap when done and tiers exceed cap', () => {
    const account = makeAccount({ done: true })
    const detail = makeDetail({
      tiers: [{ count: 1, points: 100 }],
      point_cap: 50,
    })
    expect(calculateEarnedPoints(account, detail)).toBe(50)
  })

  // Repeatable + point_cap: repeated=2 means completed 2 times total (GW2 API semantics)
  it('counts repeated cycles: repeated=2, done=true → 2x apPerCompletion', () => {
    const account = makeAccount({ done: true, repeated: 2 })
    const detail = makeDetail({
      flags: ['Repeatable'],
      tiers: [{ count: 1, points: 10 }],
      point_cap: 50,
    })
    // GW2 `repeated` = total completions; timesCompleted = 2; 2 * 10 = 20; min(20, 50) = 20
    expect(calculateEarnedPoints(account, detail)).toBe(20)
  })

  // Repeatable + point_cap: over cap → returns point_cap exactly
  it('caps repeatable AP at point_cap when cycles exceed it', () => {
    const account = makeAccount({ done: true, repeated: 10 })
    const detail = makeDetail({
      flags: ['Repeatable'],
      tiers: [{ count: 1, points: 10 }],
      point_cap: 50,
    })
    // timesCompleted = 10 + 1 = 11; 11 * 10 = 110; min(110, 50) = 50
    expect(calculateEarnedPoints(account, detail)).toBe(50)
  })

  // Repeatable without point_cap → treated as non-repeatable (done branch)
  it('treats repeatable without point_cap as done branch', () => {
    const account = makeAccount({ done: true, repeated: 5 })
    const detail = makeDetail({
      flags: ['Repeatable'],
      tiers: [{ count: 1, points: 10 }],
      // no point_cap
    })
    // Falls through to done branch: apPerCompletion = 10, point_cap = undefined → 10
    expect(calculateEarnedPoints(account, detail)).toBe(10)
  })
})
