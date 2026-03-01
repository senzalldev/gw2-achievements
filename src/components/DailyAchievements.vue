<template>
  <div class="space-y-6">
    <div v-if="loading" class="bg-slate-800 rounded-xl p-8 border border-slate-700 text-center">
      <div class="text-3xl mb-2 animate-pulse">🏛️</div>
      <p class="text-slate-400 text-sm">Loading your Wizard's Vault objectives...</p>
    </div>

    <div v-else-if="error" class="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <p class="text-red-300 text-sm p-3 bg-red-900/20 border border-red-800 rounded-lg">{{ error }}</p>
    </div>

    <template v-else>
      <!-- Daily -->
      <div v-if="daily" class="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div class="flex items-start justify-between mb-1 flex-wrap gap-2">
          <div>
            <h3 class="font-semibold text-white">🏛️ Daily</h3>
            <p class="text-xs text-slate-500">Resets at 00:00 UTC</p>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-amber-400">{{ sectionDone(daily) }} / {{ daily.objectives.length }} done</div>
            <div class="text-xs text-slate-500">{{ sectionAcclaim(daily) }} Astral Acclaim available</div>
          </div>
        </div>
        <MetaBar :section="daily" />
        <ObjectiveList :objectives="daily.objectives" />
      </div>

      <!-- Weekly -->
      <div v-if="weekly" class="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div class="flex items-start justify-between mb-1 flex-wrap gap-2">
          <div>
            <h3 class="font-semibold text-white">🏛️ Weekly</h3>
            <p class="text-xs text-slate-500">Resets Monday at 07:30 UTC</p>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-amber-400">{{ sectionDone(weekly) }} / {{ weekly.objectives.length }} done</div>
            <div class="text-xs text-slate-500">{{ sectionAcclaim(weekly) }} Astral Acclaim available</div>
          </div>
        </div>
        <MetaBar :section="weekly" />
        <ObjectiveList :objectives="weekly.objectives" />
      </div>

      <!-- Special -->
      <div v-if="special" class="bg-slate-800 rounded-xl p-5 border border-slate-700">
        <div class="flex items-start justify-between mb-1 flex-wrap gap-2">
          <div>
            <h3 class="font-semibold text-white">🏛️ Special</h3>
            <p class="text-xs text-slate-500">Limited-time objectives</p>
          </div>
          <div class="text-right">
            <div class="text-sm font-semibold text-amber-400">{{ sectionDone(special) }} / {{ special.objectives.length }} done</div>
            <div class="text-xs text-slate-500">{{ sectionAcclaim(special) }} Astral Acclaim available</div>
          </div>
        </div>
        <MetaBar :section="special" />
        <ObjectiveList :objectives="special.objectives" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getWizardsVaultDaily, getWizardsVaultWeekly, getWizardsVaultSpecial } from '../api/gw2'
import type { WizardsVaultSection, WizardsVaultObjective } from '../types/gw2'

// ---- child components (defined inline to avoid extra files) ----

const MetaBar = {
  props: ['section'],
  template: `
    <div class="mt-3 mb-4 p-3 bg-slate-700/40 rounded-lg">
      <div class="flex items-center justify-between text-xs mb-1.5">
        <span class="text-slate-400">Meta reward progress</span>
        <span :class="section.meta_reward_claimed ? 'text-emerald-400' : 'text-amber-400'">
          {{ section.meta_reward_claimed ? '✓ Claimed' : section.meta_progress_current + ' / ' + section.meta_progress_complete }}
        </span>
      </div>
      <div class="w-full bg-slate-600 rounded-full h-1.5">
        <div class="h-1.5 rounded-full" :class="section.meta_reward_claimed ? 'bg-emerald-500' : 'bg-amber-400'"
             :style="{ width: metaPct + '%' }"></div>
      </div>
      <div class="text-xs text-slate-500 mt-1">+{{ section.meta_reward_astral }} ✦ Astral Acclaim on completion</div>
    </div>
  `,
  computed: {
    metaPct(): number {
      return (this as any).section.meta_progress_complete > 0
        ? Math.min(100, Math.round((this as any).section.meta_progress_current / (this as any).section.meta_progress_complete * 100))
        : 100
    },
  },
}

const ObjectiveList = {
  props: ['objectives'],
  template: `
    <div class="space-y-2">
      <div v-for="obj in objectives" :key="obj.id"
           class="flex items-center gap-3 rounded-lg px-3 py-2.5"
           :class="isDone(obj) ? 'bg-slate-700/20' : 'bg-slate-700/40'">
        <span class="text-lg shrink-0">{{ isDone(obj) ? '✅' : '⬜' }}</span>
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium" :class="isDone(obj) ? 'text-slate-500 line-through' : 'text-white'">
            {{ obj.title }}
          </div>
          <div v-if="obj.progress_complete > 1" class="flex items-center gap-2 mt-1">
            <div class="flex-1 bg-slate-600 rounded-full h-1">
              <div class="h-1 rounded-full" :class="isDone(obj) ? 'bg-emerald-500' : 'bg-amber-400'"
                   :style="{ width: objPct(obj) + '%' }"></div>
            </div>
            <span class="text-xs text-slate-500 font-mono whitespace-nowrap">{{ obj.progress_current }}/{{ obj.progress_complete }}</span>
          </div>
        </div>
        <div class="text-xs font-semibold shrink-0" :class="isDone(obj) ? 'text-slate-600' : 'text-amber-400'">
          +{{ obj.acclaim }} ✦
        </div>
      </div>
    </div>
  `,
  methods: {
    isDone(obj: WizardsVaultObjective) {
      return obj.claimed || obj.progress_current >= obj.progress_complete
    },
    objPct(obj: WizardsVaultObjective) {
      return obj.progress_complete > 0 ? Math.min(100, Math.round(obj.progress_current / obj.progress_complete * 100)) : 100
    },
  },
}

// ---- main component ----

const props = defineProps<{ apiKey: string }>()

const loading = ref(true)
const error = ref('')
const daily = ref<WizardsVaultSection | null>(null)
const weekly = ref<WizardsVaultSection | null>(null)
const special = ref<WizardsVaultSection | null>(null)

function sectionDone(s: WizardsVaultSection) {
  return s.objectives.filter(o => o.claimed || o.progress_current >= o.progress_complete).length
}

function sectionAcclaim(s: WizardsVaultSection) {
  return s.objectives.reduce((sum, o) => sum + o.acclaim, 0)
}

onMounted(async () => {
  const results = await Promise.allSettled([
    getWizardsVaultDaily(props.apiKey),
    getWizardsVaultWeekly(props.apiKey),
    getWizardsVaultSpecial(props.apiKey),
  ])
  if (results[0].status === 'fulfilled') daily.value = results[0].value
  if (results[1].status === 'fulfilled') weekly.value = results[1].value
  if (results[2].status === 'fulfilled') special.value = results[2].value

  if (!daily.value && !weekly.value && !special.value) {
    const msg = results[0].status === 'rejected' ? (results[0].reason as Error).message : 'Unknown error'
    error.value = msg
  }
  loading.value = false
})
</script>
