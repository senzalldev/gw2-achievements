<template>
  <!-- Not loaded yet: show key input -->
  <div v-if="!accountInfo && !loading" class="min-h-screen bg-slate-900">
    <ApiKeyInput
      :loading="loading"
      :loading-stage="loadingStage"
      :error="error"
      :saved-accounts="savedAccounts"
      :open-on-form="loginOpenOnForm"
      @submit="handleLogin"
      @remove="removeAccount"
    />
  </div>

  <!-- Loading spinner -->
  <div v-else-if="loading" class="min-h-screen bg-slate-900 flex items-center justify-center">
    <div class="text-center">
      <div class="text-5xl mb-4 animate-spin">⚙️</div>
      <p class="text-amber-400 font-semibold text-lg">{{ loadingStage }}</p>
      <p class="text-slate-500 text-sm mt-1">Talking to the GW2 API — won't be long...</p>
    </div>
  </div>

  <!-- Dashboard -->
  <div v-else class="min-h-screen bg-slate-900 text-white">
    <!-- Header -->
    <header class="bg-slate-800 border-b border-slate-700 px-4 py-3 sm:px-6 sm:py-4">
      <div class="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
        <div>
          <div class="flex items-center gap-2 flex-wrap">
            <h1 class="text-xl font-bold text-amber-400">⚔️ GW2 Achievement Tracker</h1>
            <span class="text-xs bg-purple-900/50 text-purple-400 border border-purple-700/50 px-1.5 py-0.5 rounded font-medium">Experimental</span>
          </div>
          <p class="text-sm text-slate-400">
            {{ accountInfo?.name }}
            <span class="text-slate-600 mx-1">·</span>
            <span class="text-slate-500">{{ stats.total.toLocaleString() }} achievements tracked</span>
          </p>
        </div>

        <!-- Accounts dropdown -->
        <div class="flex items-center gap-2">
        <div class="relative">
          <button
            @click="accountsOpen = !accountsOpen"
            class="text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400
                   px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            Accounts <span class="text-xs">▾</span>
          </button>

          <!-- Dropdown -->
          <div
            v-if="accountsOpen"
            class="absolute right-0 top-full mt-1 w-60 bg-slate-800 border border-slate-700
                   rounded-xl shadow-xl z-50 py-1"
          >
            <div
              v-for="acct in savedAccounts"
              :key="acct.key"
              class="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50"
            >
              <button
                @click="switchTo(acct)"
                class="flex-1 text-sm text-left truncate"
                :class="acct.key === savedKey ? 'text-amber-400 font-medium' : 'text-white'"
              >
                {{ acct.accountName || '…' }}
              </button>
              <button
                @click="removeAccount(acct.key)"
                class="text-slate-500 hover:text-red-400 transition-colors text-base leading-none"
                title="Remove account"
              >×</button>
            </div>
            <div class="border-t border-slate-700/60 mt-1 pt-1 px-1">
              <button
                @click="addAccount"
                class="w-full text-left px-2 py-2 text-sm text-slate-400 hover:text-white
                       hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                + Add Account
              </button>
            </div>
          </div>

          <!-- Click-outside overlay -->
          <div v-if="accountsOpen" @click="accountsOpen = false" class="fixed inset-0 z-40" />
        </div>

        <a href="https://senzall.com" target="senzall" rel="noopener"
           class="text-sm text-amber-500 hover:text-amber-400 border border-amber-800 hover:border-amber-600
                  px-3 py-1.5 rounded-lg transition-colors hidden sm:flex items-center gap-1.5">
          senzall.com ↗
        </a>
        </div>
      </div>
    </header>

    <!-- Tab nav -->
    <nav class="bg-slate-800/50 border-b border-slate-700/50 px-4 sm:px-6">
      <div class="max-w-7xl mx-auto flex gap-1 overflow-x-auto [&::-webkit-scrollbar]:hidden" style="scrollbar-width:none">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0"
          :class="activeTab === tab.id
            ? 'border-amber-400 text-amber-400'
            : 'border-transparent text-slate-400 hover:text-slate-200'"
        >
          {{ tab.label }}
        </button>
      </div>
    </nav>

    <!-- Content filters — hidden on tabs that don't use achievement data -->
    <FilterBar v-if="!['daily', 'masteries', 'about', 'browse'].includes(activeTab)" />

    <!-- Background data loading notice -->
    <div
      v-if="!gameStatsReady"
      class="bg-slate-800/60 border-b border-slate-700/40 px-4 sm:px-6 py-1.5"
    >
      <div class="max-w-7xl mx-auto flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0"></span>
        <span class="text-xs text-slate-400">
          Loading full game data in the background — AP totals and "Not Started" counts will update when ready
        </span>
      </div>
    </div>

    <!-- Main content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

      <!-- Overview tab -->
      <template v-if="activeTab === 'overview'">
        <StatsCards :stats="filteredStats" :actual-total-points="stats.totalPoints" />

        <!-- Donut + action cards side by side -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatusDonut
            :done="filteredStats.done"
            :in-progress="filteredStats.inProgress"
            :not-started="filteredStats.notStarted"
            @select="jumpToStatus"
          />
          <div class="flex flex-col gap-4">
            <button
              @click="activeTab = 'almostdone'"
              class="bg-slate-800 border border-slate-700 rounded-xl p-5 text-left hover:border-amber-400/40 transition-colors group flex-1"
            >
              <div class="text-2xl mb-2">🏃</div>
              <div class="font-semibold text-white group-hover:text-amber-300 transition-colors">Almost Done</div>
              <div class="text-xs text-slate-400 mt-1">{{ filteredAlmostDone.length }} achievements near completion</div>
            </button>
            <button
              @click="activeTab = 'mostvaluable'"
              class="bg-slate-800 border border-slate-700 rounded-xl p-5 text-left hover:border-purple-400/40 transition-colors group flex-1"
            >
              <div class="text-2xl mb-2">💎</div>
              <div class="font-semibold text-white group-hover:text-purple-300 transition-colors">Most Valuable</div>
              <div class="text-xs text-slate-400 mt-1">{{ filteredMostValuable.length }} achievements with the most AP left</div>
            </button>
          </div>
        </div>

        <!-- Full-width bar chart -->
        <CategoryPointsChart :category-stats="filteredCategoryStats" @select="jumpToCategory" />

        <!-- About link -->
        <button
          @click="activeTab = 'about'"
          class="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-left
                 hover:border-slate-500/60 transition-colors flex items-center gap-3"
        >
          <span class="text-xl">ℹ️</span>
          <div>
            <div class="font-semibold text-white text-sm">About this app</div>
            <div class="text-xs text-slate-400">Tech stack, privacy, API key info & credits</div>
          </div>
          <span class="ml-auto text-slate-600 text-sm">→</span>
        </button>
      </template>

      <!-- My Stats tab -->
      <template v-if="activeTab === 'stats'">
        <MyStatsTab
          :achievements="filteredAchievements"
          :never-started="filteredNeverStarted"
          :category-stats="filteredCategoryStats"
          :account-info="accountInfo"
          :stats="filteredStats"
          :game-stats-ready="gameStatsReady"
        />
      </template>

      <!-- Almost Done tab -->
      <template v-if="activeTab === 'almostdone'">
        <AlmostDone
          :items="filteredAlmostDone"
          :bit-names-cache="bitNamesCache"
          :resolve-bit-names="resolveBitNames"
          @select="jumpToAchievement"
        />
      </template>

      <!-- Most Valuable tab -->
      <template v-if="activeTab === 'mostvaluable'">
        <MostValuable
          :items="filteredMostValuable"
          :bit-names-cache="bitNamesCache"
          :resolve-bit-names="resolveBitNames"
          @select="jumpToAchievement"
        />
      </template>

      <!-- Goals tab -->
      <template v-if="activeTab === 'goals'">
        <GoalsTab
          :achievements="filteredAchievements"
          :bit-names-cache="bitNamesCache"
          :resolve-bit-names="resolveBitNames"
          :api-key="savedKey"
        />
      </template>

      <!-- Categories tab -->
      <template v-if="activeTab === 'categories'">
        <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h3 class="font-semibold text-white mb-1">Category Breakdown</h3>
          <p class="text-xs text-slate-500 mb-3">Click a category to browse its achievements</p>
          <div class="relative mb-4">
            <input
              v-model="categorySearch"
              type="text"
              placeholder="Search categories..."
              class="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 pr-8 text-sm
                     placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
            />
            <button
              v-if="categorySearch"
              @click="categorySearch = ''"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
              title="Clear search"
            >×</button>
          </div>
          <div v-if="searchedCategoryStats.length === 0" class="text-slate-500 text-sm text-center py-6">
            No categories match "{{ categorySearch }}".
          </div>
          <div class="space-y-3">
            <div
              v-for="cat in searchedCategoryStats"
              :key="cat.category.id"
              class="bg-slate-700/40 rounded-lg p-4 hover:bg-slate-700/70 transition-colors cursor-pointer"
              @click="jumpToCategory(cat.category.id)"
            >
              <div class="flex items-center justify-between mb-2 flex-wrap gap-2">
                <span class="font-medium text-white">{{ cat.category.name }}</span>
                <div class="flex items-center gap-4 text-sm">
                  <span class="text-emerald-400">{{ cat.done }} done</span>
                  <span v-if="cat.inProgress > 0" class="text-amber-400">{{ cat.inProgress }} in progress</span>
                  <span class="text-purple-400">{{ cat.earnedPoints }} / {{ cat.totalPoints }} AP</span>
                </div>
              </div>
              <div class="w-full bg-slate-600 rounded-full h-2">
                <div
                  class="h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
                  :style="{ width: catCompletionPct(cat) + '%' }"
                ></div>
              </div>
              <div class="text-xs text-slate-500 mt-1">{{ catCompletionPct(cat) }}% of AP earned</div>
            </div>
          </div>
        </div>
      </template>

      <!-- Browse tab -->
      <template v-if="activeTab === 'browse'">
        <AchievementList
          :achievements="statsAchievements"
          :categories="allCategories"
          :sorted-groups="sortedGroups"
          :category-to-group="categoryToGroup"
          :preset-category="presetCategory"
          :preset-search="presetSearch"
          :preset-status="presetStatus"
          :bit-names-cache="bitNamesCache"
          :resolve-bit-names="resolveBitNames"
        />
      </template>

      <!-- Daily tab -->
      <template v-if="activeTab === 'daily'">
        <DailyAchievements :api-key="savedKey" />
      </template>

      <!-- Masteries tab -->
      <template v-if="activeTab === 'masteries'">
        <MasteryProgress :api-key="savedKey" />
      </template>

      <!-- About tab -->
      <template v-if="activeTab === 'about'">
        <AboutTab />
      </template>

      <!-- Footer -->
      <footer class="border-t border-slate-800 mt-4 py-4 text-center text-xs text-slate-600 space-y-1">
        <div class="flex items-center justify-center gap-2">
          <span>⚔️ GW2 Achievement Tracker</span>
          <span>·</span>
          <span>v{{ APP_VERSION }}</span>
          <span>·</span>
          <a href="https://senzall.com" target="senzall" rel="noopener"
             class="text-amber-700 hover:text-amber-400 transition-colors">senzall.com</a>
        </div>
        <div class="text-slate-700">Not affiliated with ArenaNet or NCSoft. Guild Wars 2 © ArenaNet, LLC.</div>
      </footer>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { APP_VERSION } from './version'
import { useAchievements } from './composables/useAchievements'
import type { CategoryStats, EnrichedAchievement } from './composables/useAchievements'
import { useContentFilter, FESTIVAL_ALIASES } from './composables/useContentFilter'
import type { SavedAccount } from './types/gw2'
import ApiKeyInput from './components/ApiKeyInput.vue'
import StatsCards from './components/StatsCards.vue'
import StatusDonut from './components/StatusDonut.vue'
import CategoryPointsChart from './components/CategoryPointsChart.vue'
import AlmostDone from './components/AlmostDone.vue'
import MostValuable from './components/MostValuable.vue'
import GoalsTab from './components/GoalsTab.vue'
import AchievementList from './components/AchievementList.vue'
import DailyAchievements from './components/DailyAchievements.vue'
import MasteryProgress from './components/MasteryProgress.vue'
import AboutTab from './components/AboutTab.vue'
import MyStatsTab from './components/MyStatsTab.vue'
import FilterBar from './components/FilterBar.vue'

const {
  accountInfo, loading, error, loadingStage, savedKey,
  savedAccounts, removeAccount,
  bitNamesCache, resolveBitNames,
  enrichedAchievements, neverStartedEnriched, stats,
  categoryToGroup, sortedGroups,
  gameStatsReady,
  loadData, reset,
} = useAchievements()

const { includePvP, includeWvW, includeHoM, festivalsAllowed } = useContentFilter()

function makeListFilter(pvp: boolean, wvw: boolean, hom: boolean, fests: Record<string, boolean>) {
  return (a: EnrichedAchievement): boolean => {
    if (a.mode === 'pvp'  && !pvp) return false
    if (a.mode === 'wvw'  && !wvw) return false
    if (a.mode === 'hom'  && !hom) return false
    // Check festivalName on ALL achievements regardless of mode — some festival achievements
    // have mode='pvp' (Pvp flag takes priority in classifyMode) but still belong to a festival.
    if (a.festivalName) {
      const canonical = FESTIVAL_ALIASES[a.festivalName] ?? a.festivalName
      if (fests[canonical] === false) return false
    }
    return true
  }
}

// List filtering — includes festival chips (hides items from lists but not from totals).
// festivalsAllowed is a computed in useContentFilter.ts that reads each individual festival
// ref explicitly — same proven pattern as includePvP/WvW/HoM. One .value read here.
const filteredAchievements = computed(() => {
  const pvp = includePvP.value
  const wvw = includeWvW.value
  const hom = includeHoM.value
  const fests = festivalsAllowed.value
  const fn = makeListFilter(pvp, wvw, hom, fests)
  return enrichedAchievements.value.filter(fn)
})
const filteredNeverStarted = computed(() => {
  const pvp = includePvP.value
  const wvw = includeWvW.value
  const hom = includeHoM.value
  const fests = festivalsAllowed.value
  const fn = makeListFilter(pvp, wvw, hom, fests)
  return neverStartedEnriched.value.filter(fn)
})

// Stats filtering — PvP/WvW/HoM only; festivals don't touch totals
const statsAchievements = computed(() => {
  const pvp = includePvP.value
  const wvw = includeWvW.value
  const hom = includeHoM.value
  return enrichedAchievements.value.filter(a => {
    if (a.mode === 'pvp' && !pvp) return false
    if (a.mode === 'wvw' && !wvw) return false
    if (a.mode === 'hom' && !hom) return false
    return true
  })
})
const statsNeverStarted = computed(() => {
  const pvp = includePvP.value
  const wvw = includeWvW.value
  const hom = includeHoM.value
  return neverStartedEnriched.value.filter(a => {
    if (a.mode === 'pvp' && !pvp) return false
    if (a.mode === 'wvw' && !wvw) return false
    if (a.mode === 'hom' && !hom) return false
    return true
  })
})
const filteredAlmostDone = computed(() =>
  filteredAchievements.value
    .filter(a => !a.account.done && a.progressPercent >= 25)
    .sort((a, b) => b.progressPercent - a.progressPercent)
    .slice(0, 25)
)
const filteredMostValuable = computed(() =>
  filteredAchievements.value
    .filter(a => !a.account.done && (a.totalPoints - a.earnedPoints) > 0)
    .sort((a, b) => (b.totalPoints - b.earnedPoints) - (a.totalPoints - a.earnedPoints))
    .slice(0, 20)
)

// Filtered stats — counts and AP totals adjusted to selected modes only.
// Chest tracker uses the real total AP (actualTotalPoints) since chests come from
// your overall AP regardless of mode.
const filteredStats = computed(() => {
  const touched = statsAchievements.value
  const untouched = statsNeverStarted.value // grows as background fetch completes
  const done = touched.filter(a => a.account.done).length
  const inProgress = touched.filter(a => !a.account.done && (a.account.current ?? 0) > 0).length
  const totalInGame = touched.length + untouched.length
  const notStarted = Math.max(0, totalInGame - done - inProgress)
  const dailyMonthlyAp = stats.value.dailyMonthlyAp
  // Exclude Daily/Weekly/Monthly-flagged and WvW-mode achievements — their AP is already
  // captured in daily_ap / monthly_ap on the account endpoint.
  const permanentAp = touched
    .filter(a => a.mode !== 'wvw' && !a.detail.flags?.some(f => ['Daily', 'Weekly', 'Monthly'].includes(f)))
    .reduce((s, a) => s + a.earnedPoints, 0)
  const totalPoints = permanentAp + dailyMonthlyAp
  // Max AP = sum of totalPoints across all filtered achievements (touched + never-started)
  const permanentMaxAp = [...touched, ...untouched].reduce((s, a) => s + a.totalPoints, 0)
  const maxPoints = permanentMaxAp + 15000
  return {
    done, inProgress, notStarted,
    total: touched.length,
    totalInGame,
    totalPoints,
    maxPoints,
    permanentAp,
    permanentMaxAp,
    dailyMonthlyAp,
  }
})

// categoryStats for chart display — uses list-filtered achievements so festival chips
// remove those category bars, while the stats cards (filteredStats) use statsAchievements
// and are unaffected by festival chips.
const filteredCategoryStats = computed<CategoryStats[]>(() => {
  const map = new Map<number, CategoryStats>()
  for (const ea of filteredAchievements.value) {
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

const allCategories = computed(() => filteredCategoryStats.value.map(cs => cs.category))

const activeTab = ref<'overview' | 'stats' | 'almostdone' | 'mostvaluable' | 'goals' | 'categories' | 'browse' | 'daily' | 'masteries' | 'about'>('overview')
const presetCategory = ref<number | ''>('')
const presetSearch = ref('')
const presetStatus = ref<'all' | 'incomplete' | 'done' | 'inprogress' | 'notstarted' | undefined>(undefined)
const categorySearch = ref('')
const accountsOpen = ref(false)
const loginOpenOnForm = ref(false)

const searchedCategoryStats = computed(() => {
  const q = categorySearch.value.toLowerCase().trim()
  if (!q) return filteredCategoryStats.value
  return filteredCategoryStats.value.filter(cat => cat.category.name.toLowerCase().includes(q))
})

const tabs = [
  { id: 'overview' as const, label: 'Overview' },
  { id: 'stats' as const, label: 'My Stats' },
  { id: 'daily' as const, label: 'Daily' },
  { id: 'almostdone' as const, label: 'Almost Done' },
  { id: 'mostvaluable' as const, label: 'Most Valuable' },
  { id: 'browse' as const, label: 'Browse All' },
  { id: 'categories' as const, label: 'Categories' },
  { id: 'goals' as const, label: 'Goals' },
  { id: 'masteries' as const, label: 'Masteries' },
  { id: 'about' as const, label: 'About' },
]

function catCompletionPct(cat: CategoryStats): number {
  return cat.totalPoints > 0 ? Math.round((cat.earnedPoints / cat.totalPoints) * 100) : 0
}

function jumpToCategory(catId: number) {
  presetCategory.value = catId
  presetSearch.value = ''
  presetStatus.value = undefined
  activeTab.value = 'browse'
}

function jumpToStatus(status: 'done' | 'inprogress' | 'notstarted') {
  presetCategory.value = ''
  presetSearch.value = ''
  presetStatus.value = status
  activeTab.value = 'browse'
}

function jumpToAchievement(item: EnrichedAchievement) {
  presetCategory.value = ''
  presetSearch.value = item.detail.name
  activeTab.value = 'browse'
}

function switchTo(acct: SavedAccount) {
  accountsOpen.value = false
  loadData(acct.key)
}

function addAccount() {
  accountsOpen.value = false
  loginOpenOnForm.value = true
  reset()
}

function handleLogin(key: string) {
  loginOpenOnForm.value = false
  loadData(key)
}

// Auto-load if a key was remembered from last session
onMounted(() => {
  if (savedKey.value) {
    loadData(savedKey.value)
  }
})
</script>
