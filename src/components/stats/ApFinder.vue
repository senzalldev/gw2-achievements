<template>
  <div class="space-y-4">
    <div>
      <h3 class="font-semibold text-white">AP Opportunity Finder</h3>
      <p class="text-xs text-slate-500 mt-0.5">Surface hidden high-value achievements worth pursuing now</p>
    </div>

    <div v-for="bucket in buckets" :key="bucket.id" class="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
      <div
        class="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
        @click="toggle(bucket.id)"
      >
        <span class="text-xl shrink-0">{{ bucket.icon }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-medium text-white text-sm">{{ bucket.title }}</span>
            <span class="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full shrink-0">
              {{ bucket.items.length }}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">{{ bucket.description }}</p>
        </div>
        <span
          class="text-slate-400 text-xs shrink-0"
          :style="{
            display: 'inline-block',
            transform: open.has(bucket.id) ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
          }"
        >▼</span>
      </div>

      <div v-if="open.has(bucket.id)" class="border-t border-slate-700/50">
        <div v-if="bucket.items.length === 0" class="text-slate-500 text-sm text-center py-8">
          {{ bucket.emptyText }}
        </div>
        <template v-else>
          <template v-for="group in groupByMode(bucket.items)" :key="group.mode">
            <!-- Mode subheader — only shown when there's more than one mode present -->
            <div
              v-if="hasMultipleModes(bucket.items)"
              class="flex items-center gap-2 px-3 py-1.5 bg-slate-900/30 border-b border-slate-700/30"
            >
              <span class="text-xs">{{ group.icon }}</span>
              <span class="text-xs font-semibold text-slate-400 uppercase tracking-wide">{{ group.label }}</span>
              <span class="text-xs text-slate-600">{{ group.items.length }}</span>
            </div>
            <div class="divide-y divide-slate-700/30">
              <div
                v-for="item in group.items"
                :key="item.account.id"
                class="flex items-center gap-3 p-3 hover:bg-slate-700/30 transition-colors"
              >
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm text-white">{{ item.detail.name }}</span>
                    <span
                      v-if="item.category"
                      class="text-xs bg-slate-600/60 text-amber-300 px-1.5 py-0.5 rounded shrink-0"
                    >{{ item.category.name }}</span>
                  </div>
                  <div v-if="item.progressPercent > 0" class="flex items-center gap-2 mt-1">
                    <div class="flex-1 bg-slate-600 rounded-full h-1">
                      <div
                        class="h-1 rounded-full bg-sky-500"
                        :style="{ width: item.progressPercent + '%' }"
                      ></div>
                    </div>
                    <span class="text-xs text-slate-500">{{ item.progressPercent }}%</span>
                  </div>
                  <p
                    v-if="item.detail.requirement"
                    class="text-xs text-slate-500 mt-0.5 truncate"
                  >{{ item.detail.requirement }}</p>
                </div>
                <div class="text-right shrink-0">
                  <div class="text-sm font-bold text-purple-400">
                    {{ (item.totalPoints - item.earnedPoints).toLocaleString() }} AP
                  </div>
                </div>
              </div>
            </div>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { EnrichedAchievement, AchievementMode } from '../../composables/useAchievements'

const props = defineProps<{
  achievements: EnrichedAchievement[]
  neverStarted: EnrichedAchievement[]
  doneIds: Set<number>
}>()

const open = ref(new Set<string>())

function toggle(id: string) {
  if (open.value.has(id)) {
    open.value.delete(id)
  } else {
    open.value.add(id)
  }
  open.value = new Set(open.value)
}

const MODE_META: Record<AchievementMode, { icon: string; label: string; order: number }> = {
  pve:      { icon: '⚔️',  label: 'PvE',               order: 0 },
  pvp:      { icon: '🏆',  label: 'PvP',               order: 1 },
  wvw:      { icon: '🗡️',  label: 'WvW',               order: 2 },
  festival: { icon: '🎪',  label: 'Festival',           order: 3 },
  hom:      { icon: '🏛️',  label: 'Hall of Monuments', order: 4 },
}

function groupByMode(items: EnrichedAchievement[]) {
  const map = new Map<AchievementMode, EnrichedAchievement[]>()
  for (const item of items) {
    const existing = map.get(item.mode)
    if (existing) existing.push(item)
    else map.set(item.mode, [item])
  }
  return [...map.entries()]
    .sort(([a], [b]) => MODE_META[a].order - MODE_META[b].order)
    .map(([mode, modeItems]) => ({ mode, items: modeItems, ...MODE_META[mode] }))
}

function hasMultipleModes(items: EnrichedAchievement[]): boolean {
  const modes = new Set(items.map(i => i.mode))
  return modes.size > 1
}

// Quick wins: truly never started, no prerequisites (uses background-fetched full set)
const quickWins = computed(() => {
  // Also include touched-but-0-progress achievements with no prerequisites
  const fromTouched = props.achievements.filter(a =>
    !a.account.done && (a.account.current ?? 0) === 0 && !a.detail.prerequisites?.length
  )
  return [...props.neverStarted.filter(a => !a.detail.prerequisites?.length), ...fromTouched]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 15)
})

// Almost unlocked: never started, has prerequisites, ALL prerequisites are done
const almostUnlocked = computed(() => {
  const fromTouched = props.achievements.filter(a => {
    if (a.account.done || (a.account.current ?? 0) > 0) return false
    if (!a.detail.prerequisites?.length) return false
    return a.detail.prerequisites.every(id => props.doneIds.has(id))
  })
  const fromNever = props.neverStarted.filter(a => {
    if (!a.detail.prerequisites?.length) return false
    return a.detail.prerequisites.every(id => props.doneIds.has(id))
  })
  return [...fromNever, ...fromTouched]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 15)
})

// Deep digs: in progress with meaningful AP remaining, sorted by AP remaining
const deepDigs = computed(() =>
  props.achievements
    .filter(a => !a.account.done && (a.account.current ?? 0) > 0 && (a.totalPoints - a.earnedPoints) > 0)
    .sort((a, b) => (b.totalPoints - b.earnedPoints) - (a.totalPoints - a.earnedPoints))
    .slice(0, 15)
)

const buckets = computed(() => [
  {
    id: 'quick',
    icon: '⚡',
    title: 'Quick Wins',
    description: "Standalone achievements you haven't started — highest AP, no prerequisites needed",
    emptyText: 'All standalone achievements are started or done!',
    items: quickWins.value,
  },
  {
    id: 'almost',
    icon: '🔓',
    title: 'Almost Unlocked',
    description: "You've completed all prerequisites — these are ready to start right now",
    emptyText: 'No unlocked-but-unstarted achievements found.',
    items: almostUnlocked.value,
  },
  {
    id: 'deep',
    icon: '⛏️',
    title: 'Deep Digs',
    description: 'Already in progress with high AP remaining — keep going',
    emptyText: 'No in-progress achievements found.',
    items: deepDigs.value,
  },
])
</script>
