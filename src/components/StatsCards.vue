<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div class="text-3xl font-bold text-emerald-400">{{ stats.done.toLocaleString() }}</div>
      <div class="text-sm text-slate-400 mt-1">Completed</div>
    </div>
    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div class="text-3xl font-bold text-amber-400">{{ stats.inProgress.toLocaleString() }}</div>
      <div class="text-sm text-slate-400 mt-1">In Progress</div>
    </div>
    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div class="text-3xl font-bold text-slate-400">{{ stats.notStarted.toLocaleString() }}</div>
      <div class="text-sm text-slate-400 mt-1">Not Started</div>
    </div>
    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div class="text-3xl font-bold text-purple-400">{{ stats.totalPoints.toLocaleString() }}</div>
      <div class="text-sm text-slate-400 mt-1">AP Earned</div>
    </div>
  </div>

  <!-- Overall progress bar -->
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <div class="flex justify-between text-sm mb-2">
      <span class="text-slate-300 font-medium">Overall Completion</span>
      <span class="text-slate-400">{{ stats.done }} / {{ stats.total }} achievements</span>
    </div>
    <div class="w-full bg-slate-700 rounded-full h-3">
      <div
        class="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-700"
        :style="{ width: completionPct + '%' }"
      ></div>
    </div>
    <div class="text-right text-xs text-slate-500 mt-1">{{ completionPct }}%</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  stats: {
    done: number
    inProgress: number
    notStarted: number
    total: number
    totalPoints: number
    maxPoints: number
  }
}>()

const completionPct = computed(() =>
  props.stats.total > 0 ? Math.round((props.stats.done / props.stats.total) * 100) : 0
)
</script>
