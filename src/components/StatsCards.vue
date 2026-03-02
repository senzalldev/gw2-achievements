<template>
  <!-- Stat cards -->
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
      <div class="text-3xl font-bold text-purple-400">{{ stats.totalPoints.toLocaleString() }}</div>
      <div class="text-sm text-slate-500 mt-1">
        AP Earned
        <span class="text-slate-600">/ {{ stats.maxPoints.toLocaleString() }}</span>
      </div>
    </div>
    <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <template v-if="nextChest">
        <div class="text-3xl font-bold text-sky-400">{{ nextChest.remaining.toLocaleString() }}</div>
        <div class="text-sm text-slate-400 mt-1">
          AP to next chest
          <span class="block text-xs text-slate-600">at {{ nextChest.target.toLocaleString() }} AP</span>
        </div>
      </template>
      <template v-else>
        <div class="text-3xl font-bold text-emerald-400">121</div>
        <div class="text-sm text-slate-400 mt-1">AP chests claimed 🎉</div>
      </template>
    </div>
  </div>

  <!-- Overall completion bar -->
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <div class="flex justify-between text-sm mb-2">
      <span class="text-slate-300 font-medium">Overall Completion</span>
      <span class="text-slate-400">{{ stats.done.toLocaleString() }} / {{ stats.totalInGame.toLocaleString() }} achievements</span>
    </div>
    <div class="w-full bg-slate-700 rounded-full h-3">
      <div
        class="bg-gradient-to-r from-emerald-500 to-emerald-400 h-3 rounded-full transition-all duration-700"
        :style="{ width: completionPct + '%' }"
      ></div>
    </div>
    <div class="text-right text-xs text-slate-500 mt-1">{{ completionPct }}%</div>
  </div>

  <!-- AP chest milestone tracker -->
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <div class="flex justify-between text-sm mb-3">
      <span class="text-slate-300 font-medium">AP Chest Progress</span>
      <span class="text-slate-400">
        Chest {{ chestsClaimed }} / 121
        <span v-if="nextChest" class="text-slate-600 ml-1">({{ nextChest.remaining }} AP to next)</span>
      </span>
    </div>

    <!-- Full 0-50k bar -->
    <div class="relative w-full bg-slate-700 rounded-full h-3 mb-2">
      <div
        class="bg-gradient-to-r from-purple-600 to-purple-400 h-3 rounded-full transition-all duration-700"
        :style="{ width: lifetimePct + '%' }"
      ></div>
      <!-- Next chest marker -->
      <div
        v-if="nextChest && nextChest.target <= 60000"
        class="absolute top-0 h-3 w-0.5 bg-sky-400 rounded"
        :style="{ left: (nextChest.target / 60000 * 100) + '%' }"
      ></div>
    </div>

    <!-- Milestone labels -->
    <div class="flex justify-between text-xs text-slate-600">
      <span>0</span>
      <span>12k</span>
      <span>24k</span>
      <span>36k</span>
      <span>48k</span>
      <span>60k AP</span>
    </div>

    <!-- Current segment: progress within this 500-AP window -->
    <div v-if="nextChest" class="mt-3 pt-3 border-t border-slate-700/50">
      <div class="flex justify-between text-xs text-slate-500 mb-1">
        <span>Current chest segment</span>
        <span class="text-sky-400">{{ segmentProgress }} / 500 AP</span>
      </div>
      <div class="w-full bg-slate-700 rounded-full h-2">
        <div
          class="bg-gradient-to-r from-sky-600 to-sky-400 h-2 rounded-full transition-all"
          :style="{ width: (segmentProgress / 500 * 100) + '%' }"
        ></div>
      </div>
    </div>
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
    totalInGame: number
    totalPoints: number
    maxPoints: number
  }
}>()

const completionPct = computed(() =>
  props.stats.totalInGame > 0 ? Math.round((props.stats.done / props.stats.totalInGame) * 100) : 0
)

// First chest at 100 AP, then every 500 AP up to 60,000 = 121 total chests
const chestsClaimed = computed(() => {
  const earned = props.stats.totalPoints
  return earned >= 100 ? 1 + Math.min(120, Math.floor(earned / 500)) : 0
})

const nextChest = computed(() => {
  const earned = props.stats.totalPoints
  if (earned >= 60000) return null
  const target = earned < 100 ? 100 : (Math.floor(earned / 500) + 1) * 500
  return { target, remaining: target - earned }
})

const segmentProgress = computed(() => props.stats.totalPoints % 500)

const lifetimePct = computed(() => Math.min(100, (props.stats.totalPoints / 60000) * 100))
</script>
