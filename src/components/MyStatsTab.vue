<template>
  <div class="space-y-6">

    <!-- Tab header with controls -->
    <div class="flex items-center justify-between flex-wrap gap-3">
      <div>
        <h2 class="text-lg font-bold text-white">My Stats</h2>
        <p class="text-xs text-slate-500 mt-0.5">Charts and highlights for your GW2 account · <span class="text-slate-600">always experimenting</span></p>
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

      <!-- AP breakdown summary -->
      <div class="flex flex-wrap gap-3 text-xs">
        <div class="flex items-center gap-2 bg-slate-700/40 rounded-lg px-3 py-2 border border-slate-600/40">
          <span class="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
          <span class="text-slate-400">Permanent</span>
          <span class="font-semibold text-white">{{ stats.permanentAp.toLocaleString() }}</span>
          <span class="text-slate-600">/ {{ stats.permanentMaxAp.toLocaleString() }}</span>
        </div>
        <div class="flex items-center gap-2 bg-slate-700/40 rounded-lg px-3 py-2 border border-slate-600/40">
          <span class="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
          <span class="text-slate-400">Daily & Monthly</span>
          <span class="font-semibold text-white">{{ stats.dailyMonthlyAp.toLocaleString() }}</span>
          <span class="text-slate-600">/ 15,000</span>
        </div>
        <div class="flex items-center gap-2 bg-slate-700/40 rounded-lg px-3 py-2 border border-slate-600/40">
          <span class="text-slate-400">Total</span>
          <span class="font-semibold text-white">{{ stats.totalPoints.toLocaleString() }}</span>
          <span class="text-slate-600">/ {{ stats.maxPoints.toLocaleString() }}</span>
          <span v-if="!gameStatsReady" class="text-slate-600 italic">(loading…)</span>
        </div>
      </div>

      <!-- Stat highlights -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700/80">
          <div class="text-xs text-slate-500 mb-1">Completed</div>
          <div class="text-xl font-bold text-emerald-400">{{ completionPct }}%</div>
          <div class="text-xs text-slate-500 mt-0.5">{{ stats.done.toLocaleString() }} / {{ stats.totalInGame.toLocaleString() }}</div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700/80">
          <div class="text-xs text-slate-500 mb-1">AP Efficiency</div>
          <div class="text-xl font-bold text-purple-400">
            <span v-if="gameStatsReady === false" class="text-slate-500 text-base">Loading…</span>
            <span v-else>{{ apEfficiency }}%</span>
          </div>
          <div class="text-xs text-slate-500 mt-0.5">{{ stats.totalPoints.toLocaleString() }} / {{ stats.maxPoints.toLocaleString() }}</div>
        </div>
        <div class="bg-slate-800 rounded-xl p-4 border border-slate-700/80">
          <div class="text-xs text-slate-500 mb-1">Best Category</div>
          <div class="text-xl font-bold text-amber-400 truncate" :title="topCategory?.category.name">
            {{ topCategoryShortName }}
          </div>
          <div class="text-xs text-slate-500 mt-0.5">{{ topCategory?.earnedPoints.toLocaleString() }} AP earned</div>
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
            :permanent-max-ap="stats.permanentMaxAp"
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
            <ProgressBucketChart :achievements="achievements" :total-in-game="stats.totalInGame" />
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
    <ApFinder :achievements="achievements" :never-started="neverStarted" :done-ids="doneIds" />

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
  neverStarted: EnrichedAchievement[]
  categoryStats: CategoryStats[]
  accountInfo: AccountInfo | null
  gameStatsReady?: boolean
  stats: {
    done: number
    inProgress: number
    notStarted: number
    total: number
    totalInGame: number
    totalPoints: number
    maxPoints: number
    permanentAp: number
    permanentMaxAp: number
    dailyMonthlyAp: number
  }
}>()

const mode = ref<'percent' | 'count'>('percent')
const exporting = ref(false)
const exportRef = ref<HTMLElement | null>(null)

const completionPct = computed(() =>
  props.stats.totalInGame > 0 ? Math.round((props.stats.done / props.stats.totalInGame) * 100) : 0
)

const apEfficiency = computed(() =>
  props.stats.maxPoints > 0 ? Math.round((props.stats.totalPoints / props.stats.maxPoints) * 100) : 0
)

// Best category = highest raw AP earned (most points put in your pocket)
const topCategory = computed(() => {
  if (!props.categoryStats.length) return null
  return [...props.categoryStats].sort((a, b) => b.earnedPoints - a.earnedPoints)[0] ?? null
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

// html2canvas doesn't support oklch (used by Tailwind v4 / modern browsers).
// Converts an oklch(L C H[ / A]) string to rgb/rgba so the canvas renderer can parse it.
function oklchToRgb(str: string): string {
  const m = str.match(
    /oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.nNaA]+)(?:\s*\/\s*([\d.]+%?))?\s*\)/i
  )
  if (!m) return str
  const g1 = m[1]!, g2 = m[2]!, g3 = m[3]!
  let l = parseFloat(g1); if (g1.includes('%')) l /= 100
  const c = parseFloat(g2)
  const h = (parseFloat(g3) || 0) * (Math.PI / 180)
  const alpha = m[4] ? (m[4].includes('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4])) : 1
  const la = c * Math.cos(h), lb = c * Math.sin(h)
  const l_ = l + 0.3963377774 * la + 0.2158037573 * lb
  const m_ = l - 0.1055613458 * la - 0.0638541728 * lb
  const s_ = l - 0.0894841775 * la - 1.2914855480 * lb
  const cb = (x: number) => x * x * x
  const rL = +4.0767416621 * cb(l_) - 3.3077115913 * cb(m_) + 0.2309699292 * cb(s_)
  const gL = -1.2684380046 * cb(l_) + 2.6097574011 * cb(m_) - 0.3413193965 * cb(s_)
  const bL = -0.0041960863 * cb(l_) - 0.7034186147 * cb(m_) + 1.7076147010 * cb(s_)
  const lin = (x: number) =>
    x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(Math.max(0, x), 1 / 2.4) - 0.055
  const r = Math.round(Math.min(255, Math.max(0, lin(rL) * 255)))
  const g = Math.round(Math.min(255, Math.max(0, lin(gL) * 255)))
  const b = Math.round(Math.min(255, Math.max(0, lin(bL) * 255)))
  return alpha < 1 ? `rgba(${r},${g},${b},${alpha.toFixed(3)})` : `rgb(${r},${g},${b})`
}

async function exportPng() {
  if (!exportRef.value || exporting.value) return
  exporting.value = true
  try {
    const { default: html2canvas } = await import('html2canvas')
    const liveRoot = exportRef.value
    const liveAll = [liveRoot, ...liveRoot.querySelectorAll<HTMLElement>('*')]
    const COLOR_PROPS = [
      'color', 'background-color',
      'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
      'outline-color', 'fill', 'stroke',
    ]
    const canvas = await html2canvas(liveRoot, {
      backgroundColor: '#0f172a',
      scale: 2,
      logging: false,
      useCORS: true,
      onclone: (clonedDoc: Document, clonedEl: HTMLElement) => {
        // 1. Replace oklch in raw <style> tag text (html2canvas parses CSS directly)
        clonedDoc.querySelectorAll('style').forEach(s => {
          if (s.textContent?.includes('oklch'))
            s.textContent = s.textContent.replace(/oklch\([^)]+\)/g, oklchToRgb)
        })
        // 2. Inline browser-resolved colours on each element (handles getComputedStyle oklch)
        const clonedAll = [clonedEl, ...clonedEl.querySelectorAll<HTMLElement>('*')]
        liveAll.forEach((liveEl, i) => {
          const clEl = clonedAll[i]
          if (!clEl) return
          const computed = window.getComputedStyle(liveEl)
          COLOR_PROPS.forEach(prop => {
            const val = computed.getPropertyValue(prop)
            if (val.includes('oklch')) clEl.style.setProperty(prop, oklchToRgb(val), 'important')
          })
        })
      },
    })
    const link = document.createElement('a')
    const name = (props.accountInfo?.name ?? 'account').replace(/\./g, '-')
    link.download = `gw2-stats-${name}.png`
    link.href = canvas.toDataURL('image/png')
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  } catch (e) {
    console.error('Export failed', e)
  } finally {
    exporting.value = false
  }
}
</script>
