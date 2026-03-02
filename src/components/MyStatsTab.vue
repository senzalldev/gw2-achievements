<template>
  <div class="space-y-6">

    <!-- Tab header with controls -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold text-white">My Stats</h2>
        <p class="text-xs text-slate-500 mt-0.5">Charts and highlights for your GW2 account</p>
      </div>
      <div class="flex items-center gap-2">
        <!-- % / # toggle -->
        <div class="flex bg-slate-800 rounded-lg border border-slate-700 p-0.5 text-sm">
          <button
            @click="mode = 'percent'"
            class="px-3 py-1 rounded transition-colors"
            :class="mode === 'percent' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >%</button>
          <button
            @click="mode = 'count'"
            class="px-3 py-1 rounded transition-colors"
            :class="mode === 'count' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'"
          >#</button>
        </div>

        <!-- Export PNG button -->
        <button
          @click="exportPng"
          :disabled="exporting"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 border border-slate-600
                 hover:border-slate-400 text-slate-300 hover:text-white text-sm rounded-lg
                 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>{{ exporting ? '⏳' : '📸' }}</span>
          <span>{{ exporting ? 'Exporting…' : 'Export PNG' }}</span>
        </button>
      </div>
    </div>

    <!-- Export capture div -->
    <div ref="exportRef" class="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-5">

      <!-- Export header -->
      <div class="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div class="text-amber-400 font-bold text-base">⚔️ {{ accountInfo?.name ?? 'GW2 Account' }}</div>
          <div class="text-slate-500 text-xs mt-0.5">GW2 Achievement Stats · tracker.senzall.com</div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold text-purple-400">{{ stats.totalPoints.toLocaleString() }}</div>
          <div class="text-xs text-slate-500">Achievement Points</div>
        </div>
      </div>

      <!-- Stat highlights -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700/80">
          <div class="text-xs text-slate-500 mb-1">Completed</div>
          <div class="text-xl font-bold text-emerald-400">{{ completionPct }}%</div>
          <div class="text-xs text-slate-500 mt-0.5">{{ stats.done.toLocaleString() }} / {{ stats.total.toLocaleString() }}</div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700/80">
          <div class="text-xs text-slate-500 mb-1">AP Efficiency</div>
          <div class="text-xl font-bold text-purple-400">{{ apEfficiency }}%</div>
          <div class="text-xs text-slate-500 mt-0.5">{{ stats.totalPoints.toLocaleString() }} / {{ stats.maxPoints.toLocaleString() }}</div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700/80">
          <div class="text-xs text-slate-500 mb-1">Best Category</div>
          <div class="text-xl font-bold text-amber-400 truncate" :title="topCategory?.category.name">
            {{ topCategoryShortName }}
          </div>
          <div class="text-xs text-slate-500 mt-0.5">{{ topCategoryPct }}% AP earned</div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700/80">
          <div class="text-xs text-slate-500 mb-1">Account Age</div>
          <div class="text-xl font-bold text-sky-400">{{ accountAge ?? '—' }}</div>
          <div class="text-xs text-slate-500 mt-0.5">Since {{ accountCreated }}</div>
        </div>
      </div>

      <!-- Charts row 1: Donut + Radar -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- AP Breakdown Donut -->
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 class="font-semibold text-white mb-3 text-sm">AP Breakdown</h3>
          <ApBreakdownDonut
            :achievements="achievements"
            :account-info="accountInfo"
            :mode="mode"
          />
        </div>

        <!-- Category Radar -->
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 class="font-semibold text-white mb-3 text-sm">Top 8 Categories</h3>
          <div style="position: relative; height: 260px">
            <CategoryRadar :category-stats="categoryStats" :mode="mode" />
          </div>
        </div>

      </div>

      <!-- Charts row 2: Progress Buckets + Category Completion -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">

        <!-- Progress distribution by bucket -->
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 class="font-semibold text-white mb-3 text-sm">Progress Distribution</h3>
          <p class="text-xs text-slate-500 mb-3">How far along are your achievements?</p>
          <div style="position: relative; height: 200px">
            <ProgressBucketChart :achievements="achievements" />
          </div>
        </div>

        <!-- Category completion rate -->
        <div class="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <h3 class="font-semibold text-white mb-3 text-sm">Category Completion</h3>
          <p class="text-xs text-slate-500 mb-3">Top 10 categories — colour shows completion tier</p>
          <div style="position: relative; height: 220px">
            <CategoryCompletionBar :category-stats="categoryStats" :mode="mode" />
          </div>
        </div>

      </div>

    </div>

    <!-- AP Opportunity Finder (not captured in export) -->
    <ApFinder :achievements="achievements" :done-ids="doneIds" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { AccountInfo } from '../types/gw2'
import type { EnrichedAchievement, CategoryStats } from '../composables/useAchievements'
import CategoryRadar from './stats/CategoryRadar.vue'
import ApBreakdownDonut from './stats/ApBreakdownDonut.vue'
import ProgressBucketChart from './stats/ProgressBucketChart.vue'
import CategoryCompletionBar from './stats/CategoryCompletionBar.vue'
import ApFinder from './stats/ApFinder.vue'

const props = defineProps<{
  achievements: EnrichedAchievement[]
  categoryStats: CategoryStats[]
  accountInfo: AccountInfo | null
  stats: {
    done: number
    inProgress: number
    notStarted: number
    total: number
    totalPoints: number
    maxPoints: number
  }
}>()

const mode = ref<'percent' | 'count'>('percent')
const exporting = ref(false)
const exportRef = ref<HTMLElement | null>(null)

const completionPct = computed(() =>
  props.stats.total > 0 ? Math.round((props.stats.done / props.stats.total) * 100) : 0
)

const apEfficiency = computed(() =>
  props.stats.maxPoints > 0 ? Math.round((props.stats.totalPoints / props.stats.maxPoints) * 100) : 0
)

const topCategory = computed(() => {
  if (!props.categoryStats.length) return null
  const sorted = [...props.categoryStats].sort((a, b) => {
    const aPct = a.totalPoints > 0 ? a.earnedPoints / a.totalPoints : 0
    const bPct = b.totalPoints > 0 ? b.earnedPoints / b.totalPoints : 0
    return bPct - aPct
  })
  return sorted[0] ?? null
})

const topCategoryPct = computed(() => {
  const cat = topCategory.value
  if (!cat) return 0
  return cat.totalPoints > 0 ? Math.round((cat.earnedPoints / cat.totalPoints) * 100) : 0
})

const topCategoryShortName = computed(() => {
  const name = topCategory.value?.category.name ?? '—'
  return name.length > 12 ? name.slice(0, 11) + '…' : name
})

const accountAge = computed(() => {
  if (!props.accountInfo?.created) return null
  const created = new Date(props.accountInfo.created)
  const now = new Date()
  const totalMonths =
    (now.getFullYear() - created.getFullYear()) * 12 +
    (now.getMonth() - created.getMonth())
  if (totalMonths < 12) return `${totalMonths}mo`
  const y = Math.floor(totalMonths / 12)
  const m = totalMonths % 12
  return m > 0 ? `${y}y ${m}mo` : `${y} years`
})

const accountCreated = computed(() => {
  if (!props.accountInfo?.created) return ''
  return new Date(props.accountInfo.created).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
  })
})

const doneIds = computed(() =>
  new Set(props.achievements.filter(a => a.account.done).map(a => a.account.id))
)

async function exportPng() {
  if (!exportRef.value || exporting.value) return
  exporting.value = true
  try {
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(exportRef.value, {
      backgroundColor: '#0f172a',
      scale: 2,
      logging: false,
      useCORS: true,
    })
    const link = document.createElement('a')
    const name = (props.accountInfo?.name ?? 'account').replace(/\./g, '-')
    link.download = `gw2-stats-${name}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  } catch (e) {
    console.error('Export failed', e)
  } finally {
    exporting.value = false
  }
}
</script>
