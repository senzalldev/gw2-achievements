<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-1">Today's Daily Achievements</h3>
    <p class="text-xs text-slate-500 mb-4">Resets daily at 00:00 UTC</p>

    <div v-if="loading" class="text-slate-400 text-sm py-8 text-center">
      <div class="text-3xl mb-2 animate-pulse">📅</div>
      Fetching today's dailies...
    </div>

    <div v-else-if="error" class="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
      {{ error }}
    </div>

    <div v-else>
      <!-- Summary bar -->
      <div class="flex items-center gap-3 mb-5 p-3 bg-slate-700/40 rounded-lg">
        <span class="text-2xl">{{ completedCount === totalCount ? '🎉' : '⚔️' }}</span>
        <div>
          <div class="text-sm font-semibold text-white">
            {{ completedCount }} of {{ totalCount }} completed today
          </div>
          <div class="text-xs text-slate-400">{{ totalAP }} achievement points available</div>
        </div>
        <div class="flex-1 ml-2">
          <div class="w-full bg-slate-600 rounded-full h-2">
            <div
              class="h-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all"
              :style="{ width: totalCount > 0 ? (completedCount / totalCount * 100) + '%' : '0%' }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Groups -->
      <div v-for="group in dailyGroups" :key="group.key" class="mb-6">
        <h4 class="text-xs font-semibold text-amber-400 uppercase tracking-widest mb-2">{{ group.label }}</h4>
        <div class="space-y-2">
          <div
            v-for="entry in group.entries"
            :key="entry.id"
            class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
            :class="isDone(entry.id) ? 'bg-slate-700/20' : 'bg-slate-700/40'"
          >
            <span class="text-lg shrink-0">{{ isDone(entry.id) ? '✅' : '⬜' }}</span>
            <div class="flex-1 min-w-0">
              <div
                class="text-sm font-medium transition-colors"
                :class="isDone(entry.id) ? 'text-slate-500 line-through' : 'text-white'"
              >
                {{ getName(entry.id) }}
              </div>
              <div class="text-xs text-slate-500">Level {{ entry.level.min }}–{{ entry.level.max }}</div>
            </div>
            <div
              class="text-xs font-semibold shrink-0"
              :class="isDone(entry.id) ? 'text-slate-600' : 'text-purple-400'"
            >
              {{ getPoints(entry.id) }} AP
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getDailyAchievements, getAchievementDetails } from '../api/gw2'
import type { DailyAchievements, DailyEntry, AchievementDetail } from '../types/gw2'

const props = defineProps<{
  accountDoneIds: Set<number>
}>()

const loading = ref(true)
const error = ref('')
const dailyData = ref<DailyAchievements | null>(null)
const detailsMap = ref(new Map<number, AchievementDetail>())

const dailyGroups = computed(() => {
  if (!dailyData.value) return []
  return [
    { key: 'pve', label: 'PvE', entries: dailyData.value.pve },
    { key: 'pvp', label: 'PvP', entries: dailyData.value.pvp },
    { key: 'wvw', label: 'WvW', entries: dailyData.value.wvw },
    { key: 'fractals', label: 'Fractals', entries: dailyData.value.fractals },
    { key: 'special', label: 'Special', entries: dailyData.value.special },
  ].filter(g => g.entries.length > 0)
})

const allEntries = computed<DailyEntry[]>(() => dailyGroups.value.flatMap(g => g.entries))
const completedCount = computed(() => allEntries.value.filter(e => isDone(e.id)).length)
const totalCount = computed(() => allEntries.value.length)
const totalAP = computed(() => allEntries.value.reduce((s, e) => s + getPoints(e.id), 0))

function isDone(id: number): boolean {
  return props.accountDoneIds.has(id)
}

function getName(id: number): string {
  return detailsMap.value.get(id)?.name ?? `Achievement #${id}`
}

function getPoints(id: number): number {
  const detail = detailsMap.value.get(id)
  if (!detail) return 0
  return detail.point_cap ?? detail.tiers.reduce((s, t) => s + t.points, 0)
}

onMounted(async () => {
  try {
    dailyData.value = await getDailyAchievements()
    const allIds = [
      ...dailyData.value.pve,
      ...dailyData.value.pvp,
      ...dailyData.value.wvw,
      ...dailyData.value.fractals,
      ...dailyData.value.special,
    ].map(e => e.id)

    const details = await getAchievementDetails([...new Set(allIds)])
    const map = new Map<number, AchievementDetail>()
    for (const d of details) map.set(d.id, d)
    detailsMap.value = map
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load daily achievements.'
  } finally {
    loading.value = false
  }
})
</script>
