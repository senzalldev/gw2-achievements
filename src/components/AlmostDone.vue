<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-1">Almost Done <span class="text-amber-400">({{ items.length }})</span></h3>
    <p class="text-xs text-slate-500 mb-4">Click any achievement to see details and what's left to do</p>

    <div v-if="items.length === 0" class="text-slate-500 text-sm text-center py-4">
      No in-progress achievements found.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="item in items"
        :key="item.account.id"
        class="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition-colors cursor-pointer"
        @click="$emit('select', item)"
      >
        <div class="flex justify-between items-start mb-1">
          <div class="flex-1 min-w-0 mr-3">
            <span class="text-sm font-medium text-white block truncate">{{ item.detail.name }}</span>
            <span v-if="item.category" class="text-xs text-amber-400">{{ item.category.name }}</span>
          </div>
          <div class="text-right shrink-0">
            <span class="text-xs text-slate-300 font-mono">
              {{ item.account.current?.toLocaleString() ?? 0 }} / {{ item.account.max?.toLocaleString() ?? 1 }}
            </span>
            <div class="text-xs text-purple-400">{{ item.totalPoints - item.earnedPoints }} AP remaining</div>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="w-full bg-slate-600 rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all duration-500"
            :class="progressColor(item.progressPercent)"
            :style="{ width: item.progressPercent + '%' }"
          ></div>
        </div>
        <div class="text-right text-xs text-slate-500 mt-0.5">{{ item.progressPercent }}%</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EnrichedAchievement } from '../composables/useAchievements'

defineProps<{ items: EnrichedAchievement[] }>()
defineEmits<{ select: [item: EnrichedAchievement] }>()

function progressColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-400'
  if (pct >= 50) return 'bg-amber-400'
  return 'bg-sky-400'
}
</script>
