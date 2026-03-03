<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-1">Achievement Status</h3>
    <p class="text-xs text-slate-500 mb-3">Click a segment to browse those achievements.</p>
    <div class="h-56">
      <Doughnut :data="chartData" :options="chartOptions" />
    </div>
    <div class="flex justify-center gap-4 mt-3 text-xs text-slate-400 flex-wrap">
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
        Done <span class="text-slate-500">({{ done.toLocaleString() }})</span>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shrink-0"></span>
        In Progress <span class="text-slate-500">({{ inProgress.toLocaleString() }})</span>
      </span>
      <span class="flex items-center gap-1.5">
        <span class="w-2.5 h-2.5 rounded-full bg-slate-600 inline-block shrink-0"></span>
        Not Started <span class="text-slate-500">({{ notStarted.toLocaleString() }})</span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { ChartEvent, ActiveElement } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  done: number
  inProgress: number
  notStarted: number
}>()

const emit = defineEmits<{ select: [status: 'done' | 'inprogress' | 'notstarted'] }>()

const statusMap = ['done', 'inprogress', 'notstarted'] as const

const total = computed(() => props.done + props.inProgress + props.notStarted)

const chartData = computed(() => ({
  labels: ['Completed', 'In Progress', 'Not Started'],
  datasets: [{
    data: [props.done, props.inProgress, props.notStarted],
    backgroundColor: ['#10b981', '#f59e0b', '#334155'],
    borderColor: ['#0f172a'],
    borderWidth: 2,
    hoverOffset: 4,
  }],
}))

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; parsed: number }) => {
          const pct = total.value > 0 ? Math.round((ctx.parsed / total.value) * 100) : 0
          return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`
        },
      },
    },
  },
  onClick: (_event: ChartEvent, elements: ActiveElement[]) => {
    const first = elements[0]
    if (first != null) {
      const status = statusMap[first.index]
      if (status) emit('select', status)
    }
  },
  onHover: (event: ChartEvent, elements: ActiveElement[]) => {
    const target = event.native?.target as HTMLCanvasElement | null
    if (target) target.style.cursor = elements.length ? 'pointer' : 'default'
  },
}))
</script>
