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
  totalAvailableAp?: number
}>()

const earned = computed(() => props.achievements.reduce((s, a) => s + a.earnedPoints, 0))
const dailyMonthly = computed(() => (props.accountInfo?.daily_ap ?? 0) + (props.accountInfo?.monthly_ap ?? 0))
const remaining = computed(() => {
  if (props.totalAvailableAp != null) {
    return Math.max(0, props.totalAvailableAp - earned.value - dailyMonthly.value)
  }
  const maxFromAchievements = props.achievements.reduce((s, a) => s + a.totalPoints, 0)
  return Math.max(0, maxFromAchievements - earned.value)
})
const grandTotal = computed(() => earned.value + dailyMonthly.value + remaining.value)

function fmt(n: number): string {
  if (props.mode === 'percent') {
    return grandTotal.value > 0 ? `${Math.round((n / grandTotal.value) * 100)}%` : '0%'
  }
  return `${n.toLocaleString()} AP`
}

const chartData = computed(() => ({
  labels: ['Achievements', 'Daily/Monthly', 'Remaining'],
  datasets: [
    {
      data: [earned.value, dailyMonthly.value, remaining.value],
      backgroundColor: ['#a855f7', '#f59e0b', '#1e293b'],
      borderColor: ['#7c3aed', '#d97706', '#334155'],
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
  { label: 'Earned (achievements)', color: '#a855f7', value: fmt(earned.value) },
  { label: 'Daily & Monthly AP', color: '#f59e0b', value: fmt(dailyMonthly.value) },
  { label: 'Available to earn', color: '#475569', value: fmt(remaining.value) },
])
</script>
