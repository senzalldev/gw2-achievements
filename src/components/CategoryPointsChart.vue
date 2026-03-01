<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-4">AP Earned by Category <span class="text-xs text-slate-400 font-normal">(top {{ displayCount }})</span></h3>
    <div :style="{ height: chartHeight + 'px' }">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import type { CategoryStats } from '../composables/useAchievements'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  categoryStats: CategoryStats[]
}>()

const displayCount = 15

const topCategories = computed(() =>
  [...props.categoryStats]
    .sort((a, b) => b.earnedPoints - a.earnedPoints)
    .slice(0, displayCount)
)

const chartHeight = computed(() => Math.max(250, topCategories.value.length * 32))

const chartData = computed(() => ({
  labels: topCategories.value.map(c => c.category.name),
  datasets: [
    {
      label: 'Earned AP',
      data: topCategories.value.map(c => c.earnedPoints),
      backgroundColor: '#f59e0b',
      borderRadius: 4,
    },
    {
      label: 'Remaining AP',
      data: topCategories.value.map(c => Math.max(0, c.totalPoints - c.earnedPoints)),
      backgroundColor: '#334155',
      borderRadius: 4,
    },
  ],
}))

const chartOptions = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        afterBody: (items: { dataIndex: number }[]) => {
          const first = items[0]
          if (!first) return []
          const cat = topCategories.value[first.dataIndex]
          if (!cat) return []
          return [`Done: ${cat.done} | In Progress: ${cat.inProgress}`]
        },
      },
    },
  },
  scales: {
    x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    y: { stacked: true, ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } },
  },
}
</script>
