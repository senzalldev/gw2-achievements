<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <div class="flex items-center justify-between mb-4 gap-3 flex-wrap">
      <h3 class="font-semibold text-white">
        {{ mode === 'potential' ? 'AP Potential by Category' : 'AP Earned by Category' }}
        <span class="text-xs text-slate-400 font-normal">(top {{ displayCount }})</span>
      </h3>
      <div class="flex rounded-lg overflow-hidden border border-slate-600 shrink-0 text-xs">
        <button
          @click="mode = 'potential'"
          class="px-3 py-1.5 transition-colors font-medium"
          :class="mode === 'potential' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-slate-200'"
        >Potential</button>
        <button
          @click="mode = 'earned'"
          class="px-3 py-1.5 transition-colors font-medium"
          :class="mode === 'earned' ? 'bg-amber-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'"
        >Earned</button>
      </div>
    </div>

    <p class="text-xs text-slate-500 mb-3">
      <template v-if="mode === 'potential'">
        Categories with the most AP still earnable — sorted by biggest opportunity first
      </template>
      <template v-else>
        Categories where you've earned the most AP so far
      </template>
    </p>

    <div :style="{ height: chartHeight + 'px' }">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import type { CategoryStats } from '../composables/useAchievements'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const props = defineProps<{
  categoryStats: CategoryStats[]
}>()

const mode = ref<'potential' | 'earned'>('potential')
const displayCount = 15

const topCategories = computed(() => {
  if (mode.value === 'potential') {
    return [...props.categoryStats]
      .filter(c => c.totalPoints - c.earnedPoints > 0)
      .sort((a, b) => (b.totalPoints - b.earnedPoints) - (a.totalPoints - a.earnedPoints))
      .slice(0, displayCount)
  }
  return [...props.categoryStats]
    .sort((a, b) => b.earnedPoints - a.earnedPoints)
    .slice(0, displayCount)
})

const chartHeight = computed(() => Math.max(250, topCategories.value.length * 32))

const chartData = computed(() => {
  if (mode.value === 'potential') {
    return {
      labels: topCategories.value.map(c => c.category.name),
      datasets: [
        {
          label: 'AP Still Available',
          data: topCategories.value.map(c => Math.max(0, c.totalPoints - c.earnedPoints)),
          backgroundColor: '#a855f7',
          borderRadius: 4,
        },
        {
          label: 'AP Already Earned',
          data: topCategories.value.map(c => c.earnedPoints),
          backgroundColor: '#1e293b',
          borderRadius: 4,
        },
      ],
    }
  }
  return {
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
  }
})

const chartOptions = computed(() => ({
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
          const remaining = cat.totalPoints - cat.earnedPoints
          return [
            `Earned: ${cat.earnedPoints} AP  |  Remaining: ${remaining} AP`,
            `Done: ${cat.done} | In Progress: ${cat.inProgress}`,
          ]
        },
      },
    },
  },
  scales: {
    x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    y: { stacked: true, ticks: { color: '#cbd5e1', font: { size: 11 } }, grid: { display: false } },
  },
}))
</script>
