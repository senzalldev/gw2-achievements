import { ref, reactive, computed } from 'vue'
import { validateKey, getAccountAchievements, getAchievementCategories, getAchievementGroups, getAchievementDetails, resolveItems, resolveSkins, resolveMinis } from '../api/gw2'
import type { AccountInfo, AccountAchievement, AchievementCategory, AchievementGroup, AchievementDetail, AchievementBit, SavedAccount } from '../types/gw2'

export interface EnrichedAchievement {
  account: AccountAchievement
  detail: AchievementDetail
  category: AchievementCategory | null
  progressPercent: number
  earnedPoints: number
  totalPoints: number
}

export interface CategoryStats {
  category: AchievementCategory
  done: number
  inProgress: number
  earnedPoints: number
  totalPoints: number
}

function calculateEarnedPoints(account: AccountAchievement, detail: AchievementDetail): number {
  const apPerCompletion = detail.tiers.reduce((s, t) => s + t.points, 0)

  // Repeatable achievements with a cap: AP comes from all completed cycles, not just the current one
  if (detail.point_cap != null && detail.flags?.includes('Repeatable')) {
    const timesCompleted = (account.repeated ?? 0) + (account.done ? 1 : 0)
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

function calculateTotalPoints(detail: AchievementDetail): number {
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
        const current = a.current ?? 0
        const max = a.max ?? 1
        const progressPercent = a.done ? 100 : Math.min(100, Math.round((current / max) * 100))
        return {
          account: a,
          detail,
          category,
          progressPercent,
          earnedPoints: calculateEarnedPoints(a, detail),
          totalPoints: calculateTotalPoints(detail),
        }
      })
  })

  const stats = computed(() => {
    const done = enrichedAchievements.value.filter(a => a.account.done).length
    const inProgress = enrichedAchievements.value.filter(a => !a.account.done && (a.account.current ?? 0) > 0).length
    const notStarted = enrichedAchievements.value.filter(a => !a.account.done && (a.account.current ?? 0) === 0).length
    const totalPoints = enrichedAchievements.value.reduce((s, a) => s + a.earnedPoints, 0)
    const maxPoints = enrichedAchievements.value.reduce((s, a) => s + a.totalPoints, 0)
    return { done, inProgress, notStarted, total: enrichedAchievements.value.length, totalPoints, maxPoints }
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

    try {
      loadingStage.value = "Checking your tracker key..."
      accountInfo.value = await validateKey(key)

      // Upsert into saved accounts
      const idx = savedAccounts.value.findIndex(a => a.key === key)
      if (idx >= 0) savedAccounts.value[idx]!.accountName = accountInfo.value!.name
      else savedAccounts.value.push({ key, accountName: accountInfo.value!.name })
      persistAccounts()
      localStorage.setItem('gw2_last_key', key)
      savedKey.value = key

      loadingStage.value = "Fetching your hero's journey..."
      const [acct, cats, grps] = await Promise.all([getAccountAchievements(key), getAchievementCategories(), getAchievementGroups()])
      accountAchievements.value = acct
      categories.value = cats
      groups.value = grps

      loadingStage.value = `Loading details for ${acct.length.toLocaleString()} achievements...`
      const details = await getAchievementDetails(acct.map(a => a.id))
      const map = new Map<number, AchievementDetail>()
      for (const d of details) map.set(d.id, d)
      detailsMap.value = map

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
    enrichedAchievements, stats, categoryStats, almostDone, incomplete, mostValuable,
    categoryToGroup, sortedGroups,
    loadData, reset,
  }
}
