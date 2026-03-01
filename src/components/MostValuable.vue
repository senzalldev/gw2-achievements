<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-1">
      Most Valuable Remaining
      <span class="text-purple-400">({{ items.length }})</span>
    </h3>
    <p class="text-xs text-slate-500 mb-4">Incomplete achievements with the most AP still earnable — biggest gains first</p>

    <div v-if="items.length === 0" class="text-slate-500 text-sm text-center py-4">
      No incomplete achievements with AP remaining found.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in items"
        :key="item.account.id"
        class="bg-slate-700/50 rounded-lg p-3 hover:bg-slate-700 transition-colors cursor-pointer flex items-center gap-3"
        @click="$emit('select', item)"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-sm font-medium text-white truncate">{{ item.detail.name }}</span>
            <span v-if="item.category" class="text-xs bg-slate-600 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
              {{ item.category.name }}
            </span>
            <span v-if="item.detail.rewards?.some(r => r.type === 'Title')"
                  class="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
              🎖️ Title
            </span>
          </div>

          <!-- Progress bar -->
          <div class="flex items-center gap-2 mt-1.5">
            <div class="flex-1 bg-slate-600 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full"
                :class="item.progressPercent >= 50 ? 'bg-amber-400' : 'bg-sky-500'"
                :style="{ width: item.progressPercent + '%' }"
              ></div>
            </div>
            <span class="text-xs text-slate-500 whitespace-nowrap">{{ item.progressPercent }}%</span>
          </div>
        </div>

        <div class="text-right shrink-0">
          <div class="text-sm font-bold text-purple-400">+{{ (item.totalPoints - item.earnedPoints).toLocaleString() }} AP</div>
          <div class="text-xs text-slate-500">remaining</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EnrichedAchievement } from '../composables/useAchievements'

defineProps<{ items: EnrichedAchievement[] }>()
defineEmits<{ select: [item: EnrichedAchievement] }>()
</script>
