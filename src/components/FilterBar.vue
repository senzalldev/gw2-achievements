<template>
  <div class="bg-slate-800/40 border-b border-slate-700/40 px-4 sm:px-6 py-2">
    <div class="max-w-7xl mx-auto flex items-center gap-2 flex-wrap">
      <span class="text-xs text-slate-500 shrink-0">Hide:</span>

      <!-- Mode chips -->
      <button
        @click="includePvP = !includePvP"
        class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors"
        :class="!includePvP
          ? 'bg-red-900/40 border-red-700/50 text-red-400'
          : 'bg-slate-800 border-slate-700/60 text-slate-500 hover:text-slate-300'"
        :title="includePvP ? 'Hide PvP achievements' : 'Show PvP achievements'"
      >🏆 PvP</button>

      <button
        @click="includeWvW = !includeWvW"
        class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors"
        :class="!includeWvW
          ? 'bg-red-900/40 border-red-700/50 text-red-400'
          : 'bg-slate-800 border-slate-700/60 text-slate-500 hover:text-slate-300'"
        :title="includeWvW ? 'Hide WvW achievements' : 'Show WvW achievements'"
      >🗡️ WvW</button>

      <button
        @click="includeHoM = !includeHoM"
        class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors"
        :class="!includeHoM
          ? 'bg-red-900/40 border-red-700/50 text-red-400'
          : 'bg-slate-800 border-slate-700/60 text-slate-500 hover:text-slate-300'"
        :title="includeHoM ? 'Hide Hall of Monuments achievements' : 'Show Hall of Monuments achievements'"
      >🏛️ HoM</button>

      <!-- Divider before festivals -->
      <span class="text-slate-700 text-xs shrink-0">|</span>
      <span class="text-xs text-slate-600 shrink-0">Festivals:</span>

      <!-- Per-festival chips — only show festivals that exist in the player's data or always show all -->
      <button
        v-for="fest in FESTIVALS"
        :key="fest.key"
        @click="toggleFestival(fest.name)"
        class="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-colors"
        :class="isFestivalHidden(fest.name)
          ? 'bg-red-900/40 border-red-700/50 text-red-400'
          : 'bg-slate-800 border-slate-700/60 text-slate-500 hover:text-slate-300'"
        :title="(isFestivalHidden(fest.name) ? 'Show ' : 'Hide ') + fest.name"
      >{{ fest.icon }} {{ fest.shortName }}</button>

      <button
        v-if="isFiltered"
        @click="reset"
        class="text-xs text-amber-600 hover:text-amber-400 transition-colors ml-1"
      >Show all</button>
      <span v-if="isModeFiltered" class="text-xs text-slate-600 italic hidden sm:inline">
        — some content hidden, max AP adjusted
      </span>
      <span v-else-if="isFiltered" class="text-xs text-slate-600 italic hidden sm:inline">
        — some content hidden from lists
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useContentFilter, FESTIVALS as RAW_FESTIVALS } from '../composables/useContentFilter'

const { includePvP, includeWvW, includeHoM, festivalRefs, isFiltered, isModeFiltered } = useContentFilter()

// Add short display names for chips
const FESTIVALS = RAW_FESTIVALS.map(f => ({
  ...f,
  shortName: {
    'Halloween':                  'Halloween',
    'Wintersday':                 'Wintersday',
    'Dragon Bash':                'Dragon Bash',
    'Lunar New Year':             'Lunar New Year',
    'Festival of the Four Winds': 'Four Winds',
    'Super Adventure Box':        'SAB',
    'Super Adventure Festival':   'SAB',
    'Ley-Line Anomaly':           'Ley-Line',
    'Bazaar of the Four Winds':   'Bazaar',
  }[f.name] ?? f.name,
}))

function isFestivalHidden(name: string): boolean {
  return festivalRefs[name]?.value === false
}

function toggleFestival(name: string): void {
  const r = festivalRefs[name]
  if (r) r.value = !r.value
}

function reset() {
  includePvP.value = true
  includeWvW.value = true
  includeHoM.value = true
  for (const r of Object.values(festivalRefs)) r.value = true
}
</script>
