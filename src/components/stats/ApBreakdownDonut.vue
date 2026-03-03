<template>
  <div>
    <div style="position: relative; height: 200px">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <div class="mt-3 space-y-1.5 text-xs">
      <div v-for="item in legend" :key="item.label" class="flex items-center gap-2">
        <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: item.color }"></div>
        <span class="text-slate-400 flex-1">{{ item.label }}</span>
        <span class="font-medium text-slate-200">{{ item.value }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { AccountInfo } from '../../types/gw2'
import type { EnrichedAchievement } from '../../composables/useAchievements'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  achievements: EnrichedAchievement[]
  accountInfo: AccountInfo | null
  mode: 'percent' | 'count'
  permanentMaxAp?: number
}>()

const earnedPermanent = computed(() => props.achievements.reduce((s, a) => s + a.earnedPoints, 0))
const earnedDailyMonthly = computed(() => (props.accountInfo?.daily_ap ?? 0) + (props.accountInfo?.monthly_ap ?? 0))

const permMax = computed(() => {
  if (props.permanentMaxAp != null) return props.permanentMaxAp
  return props.achievements.reduce((s, a) => s + a.totalPoints, 0)
})

const remainingPermanent = computed(() => Math.max(0, permMax.value - earnedPermanent.value))
const remainingDailyMonthly = computed(() => Math.max(0, 15000 - earnedDailyMonthly.value))
const grandTotal = computed(() =>
  earnedPermanent.value + earnedDailyMonthly.value + remainingPermanent.value + remainingDailyMonthly.value
)

function fmt(n: number): string {
  if (props.mode === 'percent') {
    return grandTotal.value > 0 ? `${Math.round((n / grandTotal.value) * 100)}%` : '0%'
  }
  return `${n.toLocaleString()} AP`
}

const chartData = computed(() => ({
  labels: ['Achievement AP', 'Daily & Monthly AP', 'Achievement AP remaining', 'Daily & Monthly remaining'],
  datasets: [
    {
      data: [earnedPermanent.value, earnedDailyMonthly.value, remainingPermanent.value, remainingDailyMonthly.value],
      backgroundColor: ['#a855f7', '#f59e0b', '#1e1a2e', '#1c1a10'],
      borderColor: ['#7c3aed', '#d97706', '#2d2442', '#2a2510'],
      borderWidth: 2,
      hoverOffset: 6,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: '68%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { raw: unknown; label: string }) => {
          const v = ctx.raw as number
          const total = grandTotal.value
          const pct = total > 0 ? Math.round((v / total) * 100) : 0
          return ` ${ctx.label}: ${v.toLocaleString()} AP (${pct}%)`
        },
      },
    },
  },
}))

const legend = computed(() => [
  { label: 'Achievement AP earned', color: '#a855f7', value: fmt(earnedPermanent.value) },
  { label: 'Daily & Monthly earned', color: '#f59e0b', value: fmt(earnedDailyMonthly.value) },
  { label: 'Achievement AP remaining', color: '#2d2442', value: fmt(remainingPermanent.value) },
  { label: 'Daily & Monthly remaining', color: '#2a2510', value: fmt(remainingDailyMonthly.value) },
])
</script>
