<template>
  <Radar :data="chartData" :options="chartOptions" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import type { CategoryStats } from '../../composables/useAchievements'

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const props = defineProps<{
  categoryStats: CategoryStats[]
  mode: 'percent' | 'count'
}>()

const topCats = computed(() =>
  [...props.categoryStats]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 8)
)

const chartData = computed(() => ({
  labels: topCats.value.map(c => c.category.name),
  datasets: [
    {
      label: props.mode === 'percent' ? 'Completion %' : 'Done',
      data: topCats.value.map(c =>
        props.mode === 'percent'
          ? (c.totalPoints > 0 ? Math.round((c.earnedPoints / c.totalPoints) * 100) : 0)
          : c.done
      ),
      backgroundColor: 'rgba(168,85,247,0.15)',
      borderColor: '#a855f7',
      pointBackgroundColor: '#a855f7',
      pointBorderColor: '#0f172a',
      pointHoverBackgroundColor: '#fff',
      borderWidth: 2,
      fill: true,
    },
  ],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      max: props.mode === 'percent' ? 100 : undefined,
      grid: { color: 'rgba(255,255,255,0.07)' },
      pointLabels: { color: '#94a3b8', font: { size: 10 } },
      ticks: {
        color: '#64748b',
        backdropColor: 'transparent',
        maxTicksLimit: 4,
      },
      angleLines: { color: 'rgba(255,255,255,0.07)' },
    },
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { raw: unknown }) =>
          props.mode === 'percent' ? ` ${ctx.raw}%` : ` ${ctx.raw} done`,
      },
    },
  },
}))
</script>
