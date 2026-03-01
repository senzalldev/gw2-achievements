import { ref, computed } from 'vue'
import { validateKey, getAccountAchievements, getAchievementCategories, getAchievementDetails } from '../api/gw2'
import type { AccountInfo, AccountAchievement, AchievementCategory, AchievementDetail } from '../types/gw2'

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
  if (account.done) {
    return detail.point_cap ?? detail.tiers.reduce((s, t) => s + t.points, 0)
  }
  const current = account.current ?? 0
  let earned = 0
  for (const tier of detail.tiers) {
    if (current >= tier.count) earned += tier.points
    else break
  }
  return earned
}

function calculateTotalPoints(detail: AchievementDetail): number {
  return detail.point_cap ?? detail.tiers.reduce((s, t) => s + t.points, 0)
}

export function useAchievements() {
  const accountInfo = ref<AccountInfo | null>(null)
  const loading = ref(false)
  const error = ref('')
  const loadingStage = ref('')

  const accountAchievements = ref<AccountAchievement[]>([])
  const categories = ref<AchievementCategory[]>([])
  const detailsMap = ref(new Map<number, AchievementDetail>())

  // Map achievement ID -> category
  const achievementToCategory = computed(() => {
    const map = new Map<number, AchievementCategory>()
    for (const cat of categories.value) {
      for (const id of cat.achievements) map.set(id, cat)
    }
    return map
  })

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

  async function loadData(key: string) {
    loading.value = true
    error.value = ''

    try {
      loadingStage.value = 'Validating API key...'
      accountInfo.value = await validateKey(key)

      loadingStage.value = 'Fetching your achievements and categories...'
      const [acct, cats] = await Promise.all([getAccountAchievements(key), getAchievementCategories()])
      accountAchievements.value = acct
      categories.value = cats

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
  }

  return {
    accountInfo, loading, error, loadingStage,
    enrichedAchievements, stats, categoryStats, almostDone, incomplete,
    loadData, reset,
  }
}
