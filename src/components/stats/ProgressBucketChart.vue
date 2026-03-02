<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import type { EnrichedAchievement } from '../../composables/useAchievements'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  achievements: EnrichedAchievement[]
  totalInGame: number
}>()

const counts = computed(() => {
  let earlyDays = 0, halfway = 0, almostDone = 0, complete = 0
  for (const a of props.achievements) {
    const pct = a.progressPercent
    if (a.account.done || pct >= 100) complete++
    else if (pct >= 75) almostDone++
    else if (pct >= 25) halfway++
    else if (pct > 0) earlyDays++
  }
  // notStarted = every game achievement the user hasn't touched at all
  const notStarted = Math.max(0, props.totalInGame - complete - almostDone - halfway - earlyDays)
  return { notStarted, earlyDays, halfway, almostDone, complete }
})

const chartData = computed(() => ({
  labels: ['Not Started', 'Just Started', 'Halfway', 'Almost Done', 'Complete'],
  datasets: [
    {
      label: 'Achievements',
      data: [
        counts.value.notStarted,
        counts.value.earlyDays,
        counts.value.halfway,
        counts.value.almostDone,
        counts.value.complete,
      ],
      backgroundColor: [
        'rgba(71,85,105,0.85)',
        'rgba(59,130,246,0.85)',
        'rgba(234,179,8,0.85)',
        'rgba(249,115,22,0.85)',
        'rgba(52,211,153,0.85)',
      ],
      borderRadius: 5,
      borderSkipped: false,
    },
  ],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: { color: '#64748b' },
      border: { color: 'transparent' },
    },
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
      border: { color: 'transparent' },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { raw: unknown }) => ` ${(ctx.raw as number).toLocaleString()} achievements`,
      },
    },
  },
}
</script>
