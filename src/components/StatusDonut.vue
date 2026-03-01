<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-4">Achievement Status</h3>
    <div class="h-56">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <div class="flex justify-center gap-4 mt-3 text-xs text-slate-400">
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span> Done</span>
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-amber-400 inline-block"></span> In Progress</span>
      <span class="flex items-center gap-1"><span class="w-3 h-3 rounded-full bg-slate-500 inline-block"></span> Not Started</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  done: number
  inProgress: number
  notStarted: number
}>()

const chartData = computed(() => ({
  labels: ['Completed', 'In Progress', 'Not Started'],
  datasets: [{
    data: [props.done, props.inProgress, props.notStarted],
    backgroundColor: ['#10b981', '#f59e0b', '#64748b'],
    borderColor: ['#0f172a'],
    borderWidth: 2,
  }],
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; parsed: number; dataset: { data: number[] } }) => {
          const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0
          return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`
        },
      },
    },
  },
}
</script>
