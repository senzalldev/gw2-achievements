<template>
  <Bar :data="chartData" :options="chartOptions" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import type { CategoryStats } from '../../composables/useAchievements'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  categoryStats: CategoryStats[]
  mode: 'percent' | 'count'
}>()

const topCats = computed(() => {
  const sorted =
    props.mode === 'percent'
      ? [...props.categoryStats].sort((a, b) => {
          const aPct = a.totalPoints > 0 ? a.earnedPoints / a.totalPoints : 0
          const bPct = b.totalPoints > 0 ? b.earnedPoints / b.totalPoints : 0
          return bPct - aPct
        })
      : [...props.categoryStats].sort((a, b) => b.done - a.done)
  return sorted.slice(0, 10)
})

// Color each bar by its completion level: slate → blue → amber → emerald
function barColor(c: CategoryStats): string {
  const pct = c.totalPoints > 0 ? c.earnedPoints / c.totalPoints : 0
  if (pct >= 0.9) return 'rgba(52,211,153,0.85)'
  if (pct >= 0.6) return 'rgba(245,158,11,0.85)'
  if (pct >= 0.3) return 'rgba(168,85,247,0.85)'
  return 'rgba(100,116,139,0.75)'
}

function truncate(name: string): string {
  return name.length > 18 ? name.slice(0, 17) + '…' : name
}

const chartData = computed(() => ({
  labels: topCats.value.map(c => truncate(c.category.name)),
  datasets: [
    {
      label: props.mode === 'percent' ? 'Completion %' : 'Done',
      data: topCats.value.map(c =>
        props.mode === 'percent'
          ? (c.totalPoints > 0 ? Math.round((c.earnedPoints / c.totalPoints) * 100) : 0)
          : c.done
      ),
      backgroundColor: topCats.value.map(barColor),
      borderRadius: 4,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y' as const,
  scales: {
    x: {
      beginAtZero: true,
      max: props.mode === 'percent' ? 100 : undefined,
      grid: { color: 'rgba(255,255,255,0.05)' },
      ticks: {
        color: '#64748b',
        callback: (v: string | number) => (props.mode === 'percent' ? `${v}%` : v),
      },
      border: { color: 'transparent' },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 11 } },
      border: { color: 'transparent' },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { raw: unknown }) =>
          props.mode === 'percent'
            ? ` ${ctx.raw}% complete`
            : ` ${(ctx.raw as number).toLocaleString()} done`,
      },
    },
  },
}))
</script>
