<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-1">Mastery Progress</h3>
    <p class="text-xs text-slate-500 mb-4">Click any mastery track to see individual levels</p>

    <div v-if="loading" class="text-slate-400 text-sm py-8 text-center">
      <div class="text-3xl mb-2 animate-pulse">🌟</div>
      Loading your mastery progress...
    </div>

    <div v-else-if="error" class="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-300 text-sm">
      {{ error }}
    </div>

    <div v-else>
      <!-- Region point totals -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div
          v-for="total in masteryPoints?.totals"
          :key="total.region"
          class="bg-slate-700/40 rounded-lg p-3 text-center"
        >
          <div class="text-xs text-slate-400 mb-1">{{ regionLabel(total.region) }}</div>
          <div class="text-base font-bold" :class="total.spent >= total.earned ? 'text-emerald-400' : 'text-amber-400'">
            {{ total.spent }} <span class="text-slate-500 font-normal text-xs">/ {{ total.earned }}</span>
          </div>
          <div class="text-xs text-slate-500">points spent</div>
        </div>
      </div>

      <!-- Per-region mastery tracks -->
      <div v-for="region in groupedMasteries" :key="region.name" class="mb-6">
        <h4 class="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
          {{ region.label }}
          <span class="text-xs font-normal text-slate-500">
            {{ region.tracksComplete }} / {{ region.masteries.length }} tracks complete
          </span>
        </h4>
        <div class="space-y-2">
          <div
            v-for="mastery in region.masteries"
            :key="mastery.id"
            class="bg-slate-700/40 rounded-lg overflow-hidden"
          >
            <!-- Track header — clickable -->
            <div
              class="flex items-center justify-between gap-2 p-3 cursor-pointer hover:bg-slate-700/70 transition-colors"
              @click="toggleExpand(mastery.id)"
            >
              <span class="text-sm text-white">{{ mastery.name }}</span>
              <div class="flex items-center gap-3 shrink-0">
                <span
                  class="text-xs font-mono"
                  :class="isTrackComplete(mastery.id, mastery.levels.length) ? 'text-emerald-400' : 'text-amber-400'"
                >
                  {{ getLevel(mastery.id) }} / {{ mastery.levels.length }}
                  <span v-if="isTrackComplete(mastery.id, mastery.levels.length)">✓</span>
                </span>
                <span
                  class="text-slate-400 text-xs transition-transform duration-200"
                  :style="{ display: 'inline-block', transform: expanded.has(mastery.id) ? 'rotate(180deg)' : 'rotate(0deg)' }"
                >▼</span>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="h-1 bg-slate-600 mx-3 mb-3 rounded-full">
              <div
                class="h-1 rounded-full transition-all"
                :class="isTrackComplete(mastery.id, mastery.levels.length) ? 'bg-emerald-500' : 'bg-amber-400'"
                :style="{ width: (getLevel(mastery.id) / mastery.levels.length * 100) + '%' }"
              ></div>
            </div>

            <!-- Expanded: individual levels -->
            <div v-if="expanded.has(mastery.id)" class="border-t border-slate-600/50 px-3 pb-3 pt-2 space-y-2">
              <div
                v-for="(level, idx) in mastery.levels"
                :key="idx"
                class="flex items-start gap-3 rounded-lg p-2.5"
                :class="{
                  'bg-emerald-900/20':   idx < getLevel(mastery.id),
                  'bg-amber-900/20':     idx === getLevel(mastery.id) && !isTrackComplete(mastery.id, mastery.levels.length),
                  'bg-slate-700/30':     idx > getLevel(mastery.id),
                }"
              >
                <!-- Status icon -->
                <span class="text-base shrink-0 mt-0.5">
                  <template v-if="idx < getLevel(mastery.id)">✅</template>
                  <template v-else-if="idx === getLevel(mastery.id) && !isTrackComplete(mastery.id, mastery.levels.length)">🔄</template>
                  <template v-else>🔒</template>
                </span>

                <div class="flex-1 min-w-0">
                  <div
                    class="text-sm font-medium"
                    :class="{
                      'text-emerald-300': idx < getLevel(mastery.id),
                      'text-amber-300':   idx === getLevel(mastery.id) && !isTrackComplete(mastery.id, mastery.levels.length),
                      'text-slate-500':   idx > getLevel(mastery.id),
                    }"
                  >
                    {{ level.name }}
                  </div>
                  <div
                    v-if="level.description"
                    class="text-xs mt-0.5"
                    :class="idx < getLevel(mastery.id) ? 'text-slate-500' : 'text-slate-400'"
                  >
                    {{ level.description }}
                  </div>
                </div>

                <div class="text-xs shrink-0 text-right">
                  <div :class="idx < getLevel(mastery.id) ? 'text-slate-600' : 'text-purple-400'">
                    {{ level.point_cost }} pt{{ level.point_cost !== 1 ? 's' : '' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getMasteries, getAccountMasteries, getAccountMasteryPoints } from '../api/gw2'
import type { Mastery, AccountMastery, MasteryPoints } from '../types/gw2'

const props = defineProps<{ apiKey: string }>()

const loading = ref(true)
const error = ref('')
const masteries = ref<Mastery[]>([])
const accountMasteries = ref<AccountMastery[]>([])
const masteryPoints = ref<MasteryPoints | null>(null)
const expanded = ref(new Set<number>())

const regionLabels: Record<string, string> = {
  Tyria: 'Central Tyria',
  HoT: 'Heart of Thorns',
  PoF: 'Path of Fire',
  Icebrood: 'Icebrood Saga',
  EoD: 'End of Dragons',
  SotO: 'Secrets of the Obscure',
}

function regionLabel(region: string): string {
  return regionLabels[region] ?? region
}

const levelMap = computed(() => {
  const map = new Map<number, number>()
  for (const am of accountMasteries.value) map.set(am.id, am.level)
  return map
})

function getLevel(id: number): number {
  return levelMap.value.get(id) ?? 0
}

function isTrackComplete(id: number, maxLevels: number): boolean {
  return getLevel(id) >= maxLevels
}

function toggleExpand(id: number) {
  if (expanded.value.has(id)) expanded.value.delete(id)
  else expanded.value.add(id)
  expanded.value = new Set(expanded.value)
}

const regionOrder = ['Tyria', 'HoT', 'PoF', 'Icebrood', 'EoD', 'SotO']

const groupedMasteries = computed(() => {
  const byRegion = new Map<string, Mastery[]>()
  for (const m of masteries.value) {
    if (!byRegion.has(m.region)) byRegion.set(m.region, [])
    byRegion.get(m.region)!.push(m)
  }

  const allRegions = [
    ...regionOrder.filter(r => byRegion.has(r)),
    ...[...byRegion.keys()].filter(r => !regionOrder.includes(r)),
  ]

  return allRegions.map(region => {
    const tracks = byRegion.get(region) ?? []
    return {
      name: region,
      label: regionLabel(region),
      masteries: tracks,
      tracksComplete: tracks.filter(m => isTrackComplete(m.id, m.levels.length)).length,
    }
  })
})

onMounted(async () => {
  try {
    const [masteriesData, accountData, pointsData] = await Promise.all([
      getMasteries(),
      getAccountMasteries(props.apiKey),
      getAccountMasteryPoints(props.apiKey),
    ])
    masteries.value = masteriesData
    accountMasteries.value = accountData
    masteryPoints.value = pointsData
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load mastery data.'
  } finally {
    loading.value = false
  }
})
</script>
