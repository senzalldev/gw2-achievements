import { ref, reactive, computed } from 'vue'
import { validateKey, getAccountAchievements, getAchievementCategories, getAchievementGroups, getAchievementDetails, resolveItems, resolveSkins, resolveMinis } from '../api/gw2'
import type { AccountInfo, AccountAchievement, AchievementCategory, AchievementGroup, AchievementDetail, AchievementBit, SavedAccount } from '../types/gw2'

export type AchievementMode = 'pve' | 'pvp' | 'wvw' | 'festival' | 'hom'

export interface EnrichedAchievement {
  account: AccountAchievement
  detail: AchievementDetail
  category: AchievementCategory | null
  group: string | null
  mode: AchievementMode
  festivalName: string | null  // canonical festival name, null for non-festival achievements
  progressPercent: number
  earnedPoints: number
  totalPoints: number
}

// Canonical festival names used as toggle keys in the filter bar
const FESTIVAL_CANONICAL = [
  'Halloween',
  'Wintersday',
  'Dragon Bash',
  'Lunar New Year',
  'Festival of the Four Winds',
  'Super Adventure Box',
] as const

// Detect which festival an achievement belongs to, using:
// 1. Exact group/category name match
// 2. Category name starts with a canonical festival name (e.g. "Super Adventure Box: Nostalgia")
// 3. Keyword fallback for names that don't contain the festival name directly
export function detectFestival(
  groupName: string | null | undefined,
  categoryName: string | null | undefined,
): string | null {
  const names = [groupName, categoryName].filter(Boolean) as string[]

  // Exact match or starts-with on either name
  for (const name of names) {
    for (const f of FESTIVAL_CANONICAL) {
      if (name === f || name.startsWith(f + ':') || name.startsWith(f + ' ')) return f
    }
  }

  // Keyword fallback for sub-categories that don't share the festival name
  // Keywords verified against live /v2/achievements/categories API
  const combined = names.join(' ').toLowerCase()
  if (/halloween|shadow of the mad king|blood and madness|mad king|lunatic/.test(combined)) return 'Halloween'
  if (/wintersday|winter wonderland|bell choir|toypocalypse|toy apocalypse|snowball|toymaker|tixx|winter'?s presence/.test(combined)) return 'Wintersday'
  if (/dragon bash|dragon ball/.test(combined)) return 'Dragon Bash'
  if (/lunar new year|new year|celestial challenge|celestial animal|lucky envelope|red lantern/.test(combined)) return 'Lunar New Year'
  if (/four winds|bazaar|jubilee|queen jennah|crown pavilion|zephyrite|boss blitz/.test(combined)) return 'Festival of the Four Winds'
  if (/super adventure/.test(combined)) return 'Super Adventure Box'

  return null
}

export function classifyMode(
  flags: string[],
  groupName: string | null | undefined,
  categoryName: string | null | undefined,
): AchievementMode {
  if (flags.includes('Pvp')) return 'pvp'
  if (groupName === 'Player vs. Player') return 'pvp'
  if (groupName === 'World vs. World') return 'wvw'
  if (groupName === 'Hall of Monuments') return 'hom'
  if (detectFestival(groupName, categoryName) !== null) return 'festival'
  return 'pve'
}

export interface CategoryStats {
  category: AchievementCategory
  done: number
  inProgress: number
  earnedPoints: number
  totalPoints: number
}

export function calculateEarnedPoints(account: AccountAchievement, detail: AchievementDetail): number {
  const apPerCompletion = detail.tiers.reduce((s, t) => s + t.points, 0)

  // Repeatable achievements with a cap: AP comes from all completed cycles, not just the current one
  if (detail.point_cap != null && detail.flags?.includes('Repeatable')) {
    // GW2 API: `repeated` is the TOTAL number of completions (not extra beyond the first).
    // Do NOT add +1 for done — that was double-counting the first completion.
    // Fall back to 1 if done=true but `repeated` is absent (old API data edge case).
    const timesCompleted = account.repeated ?? (account.done ? 1 : 0)
    return Math.min(timesCompleted * apPerCompletion, detail.point_cap)
  }

  if (account.done) {
    return detail.point_cap ?? apPerCompletion
  }
  const current = account.current ?? 0
  let earned = 0
  for (const tier of detail.tiers) {
    if (current >= tier.count) earned += tier.points
    else break
  }
  return Math.min(earned, detail.point_cap ?? earned)
}

export function calculateTotalPoints(detail: AchievementDetail): number {
  return detail.point_cap ?? detail.tiers.reduce((s, t) => s + t.points, 0)
}

// Shared bit name cache — persists for the lifetime of the page
const bitNamesCache = reactive(new Map<string, string>())

async function resolveBitNames(bits: AchievementBit[]): Promise<void> {
  const itemIds: number[] = []
  const skinIds: number[] = []
  const miniIds: number[] = []

  for (const bit of bits) {
    if (bit.id == null) continue
    const cacheKey = `${bit.type.toLowerCase()}:${bit.id}`
    if (bitNamesCache.has(cacheKey)) continue
    if (bit.type === 'Item') itemIds.push(bit.id)
    else if (bit.type === 'Skin') skinIds.push(bit.id)
    else if (bit.type === 'Minipet') miniIds.push(bit.id)
  }

  if (itemIds.length + skinIds.length + miniIds.length === 0) return

  try {
    const [items, skins, minis] = await Promise.all([
      resolveItems(itemIds),
      resolveSkins(skinIds),
      resolveMinis(miniIds),
    ])
    for (const [id, name] of items) bitNamesCache.set(`item:${id}`, name)
    for (const [id, name] of skins) bitNamesCache.set(`skin:${id}`, name)
    for (const [id, name] of minis) bitNamesCache.set(`minipet:${id}`, name)
  } catch {
    // Silently ignore — bit names fall back to ID labels
  }
}

function loadSavedAccounts(): SavedAccount[] {
  try { return JSON.parse(localStorage.getItem('gw2_accounts') ?? '[]') }
  catch { return [] }
}

export function useAchievements() {
  const accountInfo = ref<AccountInfo | null>(null)
  const loading = ref(false)
  const error = ref('')
  const loadingStage = ref('')

  const savedAccounts = ref<SavedAccount[]>(loadSavedAccounts())

  // True once the background fetch of all game achievement details has settled.
  // Until then, maxPoints is computed only from the user's tracked achievements.
  const gameStatsReady = ref(false)

  function persistAccounts() {
    localStorage.setItem('gw2_accounts', JSON.stringify(savedAccounts.value))
  }

  // Migrate from old single-key storage
  if (!localStorage.getItem('gw2_accounts') && localStorage.getItem('gw2_api_key')) {
    const oldKey = localStorage.getItem('gw2_api_key')!
    savedAccounts.value = [{ key: oldKey, accountName: '' }]
    persistAccounts()
    localStorage.removeItem('gw2_api_key')
  }

  const savedKey = ref(
    localStorage.getItem('gw2_last_key') ?? savedAccounts.value[0]?.key ?? ''
  )

  const accountAchievements = ref<AccountAchievement[]>([])
  const categories = ref<AchievementCategory[]>([])
  const groups = ref<AchievementGroup[]>([])
  const detailsMap = ref(new Map<number, AchievementDetail>())

  // Total unique achievement IDs across all categories — the true game total.
  // Available immediately after the categories fetch (main load), before background fetch.
  const totalAchievementsInGame = computed(() =>
    new Set(categories.value.flatMap(c => c.achievements)).size
  )

  // Sum of totalPoints across every detail in detailsMap.
  // Initially covers only the user's tracked achievements; grows to full game total
  // once the background fetch completes.
  const gameMaxAchievementPoints = computed(() => {
    let total = 0
    for (const detail of detailsMap.value.values()) {
      total += calculateTotalPoints(detail)
    }
    return total
  })

  // Map achievement ID -> category
  const achievementToCategory = computed(() => {
    const map = new Map<number, AchievementCategory>()
    for (const cat of categories.value) {
      for (const id of cat.achievements) map.set(id, cat)
    }
    return map
  })

  // Map category ID -> group name (sorted by group order for dropdown use)
  const categoryToGroup = computed(() => {
    const map = new Map<number, string>()
    const sorted = [...groups.value].sort((a, b) => a.order - b.order)
    for (const group of sorted) {
      for (const catId of group.categories) map.set(catId, group.name)
    }
    return map
  })

  // Groups sorted by order, for building filter dropdowns
  const sortedGroups = computed(() =>
    [...groups.value].sort((a, b) => a.order - b.order)
  )

  const enrichedAchievements = computed<EnrichedAchievement[]>(() => {
    return accountAchievements.value
      .filter(a => detailsMap.value.has(a.id))
      .map(a => {
        const detail = detailsMap.value.get(a.id)!
        const category = achievementToCategory.value.get(a.id) ?? null
        const groupName = category ? (categoryToGroup.value.get(category.id) ?? null) : null
        const current = a.current ?? 0
        const max = a.max ?? 1
        const progressPercent = a.done ? 100 : Math.min(100, Math.round((current / max) * 100))
        return {
          account: a,
          detail,
          category,
          group: groupName,
          festivalName: detectFestival(groupName, category?.name ?? null),
          mode: classifyMode(detail.flags ?? [], groupName, category?.name ?? null),
          progressPercent,
          earnedPoints: calculateEarnedPoints(a, detail),
          totalPoints: calculateTotalPoints(detail),
        }
      })
  })

  const stats = computed(() => {
    const done = enrichedAchievements.value.filter(a => a.account.done).length
    const inProgress = enrichedAchievements.value.filter(a => !a.account.done && (a.account.current ?? 0) > 0).length
    const totalInGame = totalAchievementsInGame.value
    // notStarted = every achievement in the game the user has not completed or started.
    // This includes achievements the API never returned (truly never touched).
    const notStarted = Math.max(0, totalInGame - done - inProgress)
    // Achievements with Daily/Weekly/Monthly flags are rotating — their cumulative AP is
    // already captured in daily_ap / monthly_ap on the account endpoint. Exclude them from
    // permanentAp to avoid double-counting.
    // WvW-mode achievements are also excluded: GW2 counts their AP in daily_ap regardless
    // of the Permanent flag (empirically verified — WvW tier-completion AP matches the
    // daily_ap pool exactly in live account data).
    const dailyMonthlyAp = (accountInfo.value?.daily_ap ?? 0) + (accountInfo.value?.monthly_ap ?? 0)
    const permanentAp = enrichedAchievements.value
      .filter(a => a.mode !== 'wvw' && !a.detail.flags?.some(f => ['Daily', 'Weekly', 'Monthly'].includes(f)))
      .reduce((s, a) => s + a.earnedPoints, 0)
    const totalPoints = permanentAp + dailyMonthlyAp
    // GW2 wiki: daily/monthly AP hard-capped at 15,000 total.
    // gameMaxAchievementPoints starts as user's tracked AP and grows to the full game max
    // once the background fetch settles.
    const permanentMaxAp = gameMaxAchievementPoints.value
    const maxPoints = permanentMaxAp + 15000
    return {
      done,
      inProgress,
      notStarted,
      total: enrichedAchievements.value.length, // tracked count — used by Browse/tabs
      totalInGame,                               // true game total — used for completion %
      totalPoints,
      maxPoints,
      permanentAp,
      permanentMaxAp,
      dailyMonthlyAp,
    }
  })

  const categoryStats = computed<CategoryStats[]>(() => {
    const map = new Map<number, CategoryStats>()
    for (const ea of enrichedAchievements.value) {
      if (!ea.category) continue
      if (!map.has(ea.category.id)) {
        map.set(ea.category.id, { category: ea.category, done: 0, inProgress: 0, earnedPoints: 0, totalPoints: 0 })
      }
      const s = map.get(ea.category.id)!
      if (ea.account.done) s.done++
      else if ((ea.account.current ?? 0) > 0) s.inProgress++
      s.earnedPoints += ea.earnedPoints
      s.totalPoints += ea.totalPoints
    }
    return Array.from(map.values()).sort((a, b) => b.earnedPoints - a.earnedPoints)
  })

  // Achievements that are in detailsMap (from background fetch) but the user has never touched.
  // Used by the AP Finder to surface Quick Wins and Almost Unlocked opportunities.
  const neverStartedEnriched = computed<EnrichedAchievement[]>(() => {
    if (!gameStatsReady.value) return []
    const accountIds = new Set(accountAchievements.value.map(a => a.id))
    const result: EnrichedAchievement[] = []
    for (const [id, detail] of detailsMap.value) {
      if (accountIds.has(id)) continue
      const totalPoints = calculateTotalPoints(detail)
      if (totalPoints === 0) continue
      const category = achievementToCategory.value.get(id) ?? null
      const groupName = category ? (categoryToGroup.value.get(category.id) ?? null) : null
      const lastTier = detail.tiers[detail.tiers.length - 1]
      result.push({
        account: { id, done: false, current: 0, max: lastTier ? lastTier.count : 1 },
        detail,
        category,
        group: groupName,
        festivalName: detectFestival(groupName, category?.name ?? null),
        mode: classifyMode(detail.flags ?? [], groupName, category?.name ?? null),
        progressPercent: 0,
        earnedPoints: 0,
        totalPoints,
      })
    }
    return result
  })

  const almostDone = computed<EnrichedAchievement[]>(() =>
    enrichedAchievements.value
      .filter(a => !a.account.done && a.progressPercent >= 25)
      .sort((a, b) => b.progressPercent - a.progressPercent)
      .slice(0, 25)
  )

  const incomplete = computed<EnrichedAchievement[]>(() =>
    enrichedAchievements.value
      .filter(a => !a.account.done)
      .sort((a, b) => b.progressPercent - a.progressPercent)
  )

  const mostValuable = computed<EnrichedAchievement[]>(() =>
    enrichedAchievements.value
      .filter(a => !a.account.done && (a.totalPoints - a.earnedPoints) > 0)
      .sort((a, b) => (b.totalPoints - b.earnedPoints) - (a.totalPoints - a.earnedPoints))
      .slice(0, 20)
  )

  async function loadData(key: string) {
    loading.value = true
    error.value = ''
    gameStatsReady.value = false

    try {
      loadingStage.value = "Verifying API key..."
      accountInfo.value = await validateKey(key)

      // Upsert into saved accounts
      const idx = savedAccounts.value.findIndex(a => a.key === key)
      const accountName = accountInfo.value!.name
      const existing = idx >= 0 ? savedAccounts.value[idx] : undefined
      if (existing) existing.accountName = accountName
      else savedAccounts.value.push({ key, accountName })
      persistAccounts()
      localStorage.setItem('gw2_last_key', key)
      savedKey.value = key

      loadingStage.value = "Loading your achievement progress..."
      const [acct, cats, grps] = await Promise.all([getAccountAchievements(key), getAchievementCategories(), getAchievementGroups()])
      accountAchievements.value = acct
      categories.value = cats
      groups.value = grps

      loadingStage.value = `Fetching details for ${acct.length.toLocaleString()} achievements...`
      const details = await getAchievementDetails(acct.map(a => a.id))
      const map = new Map<number, AchievementDetail>()
      for (const d of details) map.set(d.id, d)
      detailsMap.value = map

      // Background fetch: load details for ALL game achievement IDs so we can compute
      // the true game max AP. Non-blocking — UI is already usable at this point.
      const allCategoryIds = [...new Set(cats.flatMap(c => c.achievements))]
      const missingIds = allCategoryIds.filter(id => !map.has(id))
      if (missingIds.length > 0) {
        getAchievementDetails(missingIds)
          .then(extraDetails => {
            const extended = new Map(detailsMap.value)
            for (const d of extraDetails) extended.set(d.id, d)
            detailsMap.value = extended
            gameStatsReady.value = true
          })
          .catch(() => {
            gameStatsReady.value = true // use best estimate on failure
          })
      } else {
        gameStatsReady.value = true
      }

    } catch (e) {
      error.value = e instanceof Error ? e.message : 'An unknown error occurred.'
    } finally {
      loading.value = false
      loadingStage.value = ''
    }
  }

  function reset() {
    accountInfo.value = null
    accountAchievements.value = []
    categories.value = []
    detailsMap.value = new Map()
    error.value = ''
    gameStatsReady.value = false
    localStorage.removeItem('gw2_last_key')
    savedKey.value = ''
  }

  function removeAccount(key: string) {
    savedAccounts.value = savedAccounts.value.filter(a => a.key !== key)
    persistAccounts()
    if (savedKey.value === key) reset()
  }

  return {
    accountInfo, loading, error, loadingStage, savedKey,
    savedAccounts, removeAccount,
    bitNamesCache, resolveBitNames,
    enrichedAchievements, neverStartedEnriched, stats, categoryStats, almostDone, incomplete, mostValuable,
    categoryToGroup, sortedGroups,
    gameStatsReady,
    loadData, reset,
  }
}
