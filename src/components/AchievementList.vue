<template>
  <div class="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 class="font-semibold text-white mb-4">Browse Achievements</h3>

    <!-- Filters row 1: search -->
    <div class="relative mb-3">
      <input
        v-model="search"
        type="text"
        placeholder="Search for an achievement... (e.g. Conservation of Magic)"
        class="w-full bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 pr-8 text-sm
               placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
      />
      <button
        v-if="search"
        @click="search = ''"
        class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-lg leading-none"
        title="Clear search"
      >×</button>
    </div>

    <!-- Filters row 2: dropdowns -->
    <div class="flex flex-wrap gap-2 mb-2">
      <select
        v-model="groupFilter"
        class="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:border-amber-400 transition flex-1 min-w-36"
      >
        <option value="">All Content</option>
        <option v-for="g in props.sortedGroups" :key="g.id" :value="g.name">
          {{ g.name }}
        </option>
      </select>

      <select
        v-model="selectedCategory"
        class="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:border-amber-400 transition flex-1 min-w-36"
      >
        <option value="">All Categories</option>
        <option v-for="cat in sortedCategories" :key="cat.id" :value="cat.id">
          {{ cat.name }}
        </option>
      </select>
    </div>

    <div class="flex flex-wrap gap-2 mb-4">
      <select
        v-model="statusFilter"
        class="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:border-amber-400 transition flex-1 min-w-32"
      >
        <option value="incomplete">Incomplete</option>
        <option value="all">All</option>
        <option value="done">Completed</option>
        <option value="inprogress">In Progress</option>
        <option value="notstarted">Not Started</option>
      </select>

      <select
        v-model="typeFilter"
        class="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:border-amber-400 transition flex-1 min-w-32"
      >
        <option value="all">All Types</option>
        <option value="collections">Collections</option>
        <option value="titles">Titles</option>
        <option value="repeatable">Repeatable</option>
      </select>

      <select
        v-model="sortBy"
        class="bg-slate-900 border border-slate-600 text-white rounded-lg px-3 py-2 text-sm
               focus:outline-none focus:border-amber-400 transition flex-1 min-w-36"
      >
        <option value="progress">Sort: Progress %</option>
        <option value="ap-remaining">Sort: AP Remaining</option>
        <option value="name">Sort: Name A–Z</option>
      </select>
    </div>

    <!-- Count + clear filters + collapse all -->
    <div class="flex items-center justify-between mb-3 gap-2 flex-wrap">
      <div class="text-xs text-slate-500">Showing {{ visible.length }} of {{ filtered.length }} achievements</div>
      <div class="flex items-center gap-3">
        <button
          v-if="isFiltered"
          @click="clearFilters"
          class="text-xs text-amber-400 hover:text-amber-300 transition-colors"
        >
          ✕ Clear filters
        </button>
        <button
          v-if="expanded.size > 0"
          @click="expanded = new Set()"
          class="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Collapse all
        </button>
      </div>
    </div>

    <!-- List -->
    <div v-if="visible.length === 0" class="text-slate-500 text-sm text-center py-8">
      No achievements match your filters.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="item in visible"
        :key="item.account.id"
        class="bg-slate-700/40 rounded-lg p-3 hover:bg-slate-700/70 transition-colors cursor-pointer"
        @click="toggleExpand(item)"
      >
        <!-- Row summary -->
        <div class="flex items-center gap-3">
          <!-- Status icon -->
          <span class="text-lg shrink-0">
            {{ item.account.done ? '✅' : (item.account.current ?? 0) > 0 ? '🔄' : '⬜' }}
          </span>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium text-white">{{ item.detail.name }}</span>
              <span v-if="item.category" class="text-xs bg-slate-600 text-amber-300 px-2 py-0.5 rounded-full">
                {{ item.category.name }}
              </span>
              <span v-if="item.detail.rewards?.some(r => r.type === 'Title')"
                    class="text-xs bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded-full">
                🎖️ Title
              </span>
              <span v-if="item.account.repeated && item.account.repeated > 0"
                    class="text-xs bg-sky-900/40 text-sky-300 px-2 py-0.5 rounded-full">
                🔁 ×{{ item.account.repeated }}
              </span>
            </div>

            <!-- Inline progress for in-progress -->
            <div v-if="!item.account.done && (item.account.current ?? 0) > 0" class="flex items-center gap-2 mt-1">
              <div class="flex-1 bg-slate-600 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full bg-amber-400"
                  :style="{ width: item.progressPercent + '%' }"
                ></div>
              </div>
              <span class="text-xs text-slate-400 font-mono whitespace-nowrap">
                {{ item.account.current?.toLocaleString() }}/{{ item.account.max?.toLocaleString() }}
              </span>
            </div>
          </div>

          <div class="text-right shrink-0">
            <div class="text-xs font-semibold" :class="item.account.done ? 'text-emerald-400' : 'text-purple-400'">
              {{ item.earnedPoints }} / {{ item.totalPoints }} AP
            </div>
            <div class="text-xs text-slate-500">{{ item.progressPercent }}%</div>
          </div>
        </div>

        <!-- Expanded detail -->
        <div v-if="expanded.has(item.account.id)" class="mt-3 pt-3 border-t border-slate-600">
          <p v-if="item.detail.requirement" class="text-xs text-slate-400 mb-2">
            <strong class="text-slate-300">Requirement:</strong> {{ item.detail.requirement }}
          </p>
          <p v-if="item.detail.description" class="text-xs text-slate-400 mb-2">
            {{ item.detail.description }}
          </p>

          <!-- Wiki link -->
          <a
            :href="wikiUrl(item.detail.name)"
            target="_blank"
            rel="noopener"
            @click.stop
            class="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors mb-2"
          >
            📖 View on GW2 Wiki ↗
          </a>

          <!-- Tiers -->
          <div v-if="item.detail.tiers.length > 1" class="mt-2">
            <div class="text-xs text-slate-500 mb-1">Tiers:</div>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(tier, i) in item.detail.tiers"
                :key="i"
                class="text-xs px-2 py-0.5 rounded"
                :class="(item.account.current ?? 0) >= tier.count
                  ? 'bg-emerald-900/50 text-emerald-400'
                  : 'bg-slate-700 text-slate-400'"
              >
                {{ tier.count.toLocaleString() }} → {{ tier.points }} AP
              </span>
            </div>
          </div>

          <!-- "Still to do" — bit-based achievements -->
          <div
            v-if="!item.account.done && item.detail.bits?.length"
            class="mt-3 pt-3 border-t border-slate-600/50"
          >
            <div class="flex items-center justify-between mb-2 gap-2 flex-wrap">
              <h4 class="text-sm font-semibold text-amber-400">
                Still to do
                <span class="text-slate-500 font-normal text-xs ml-1">
                  ({{ remainingBitsFor(item).length }} of {{ displayableBitCount(item) }} tasks left)
                </span>
              </h4>
              <button
                v-if="remainingBitsFor(item).length > 0"
                @click.stop="copyRemaining(item)"
                class="text-xs px-3 py-1 rounded-lg border transition-colors shrink-0"
                :class="copyFeedback === item.account.id
                  ? 'border-emerald-500 text-emerald-400 bg-emerald-900/20'
                  : 'border-amber-400/40 text-amber-400 hover:border-amber-400 hover:bg-amber-400/10'"
              >
                {{ copyFeedback === item.account.id ? '✓ Copied!' : '📋 Copy my to-do list' }}
              </button>
            </div>

            <!-- Remaining tasks -->
            <ul v-if="remainingBitsFor(item).length > 0" class="space-y-1 mb-2">
              <li
                v-for="(bit, idx) in remainingBitsFor(item)"
                :key="idx"
                class="flex items-start gap-2 text-xs text-amber-100"
              >
                <span class="text-amber-400 mt-0.5 shrink-0">○</span>
                <span>{{ getBitName(bit) }}</span>
              </li>
            </ul>
            <div v-else class="text-xs text-emerald-400 mb-2">All tasks complete — achievement should unlock soon!</div>

            <!-- Completed tasks (collapsed) -->
            <details v-if="doneBitsFor(item).length > 0" class="mt-1">
              <summary class="text-xs text-slate-500 cursor-pointer hover:text-slate-400 transition-colors select-none">
                Completed ({{ doneBitsFor(item).length }})
              </summary>
              <ul class="mt-1.5 space-y-1 pl-1">
                <li
                  v-for="(bit, idx) in doneBitsFor(item)"
                  :key="idx"
                  class="flex items-start gap-2 text-xs text-slate-600"
                >
                  <span class="shrink-0">✓</span>
                  <span>{{ getBitName(bit) }}</span>
                </li>
              </ul>
            </details>
          </div>

          <!-- "Still to do" — count-based (no bits) -->
          <div
            v-else-if="!item.account.done && item.account.current != null && item.account.max != null"
            class="mt-3 pt-3 border-t border-slate-600/50 flex items-center justify-between gap-2"
          >
            <span class="text-xs text-slate-400">
              {{ (item.account.max - item.account.current).toLocaleString() }} more to go
            </span>
            <button
              @click.stop="copyRemaining(item)"
              class="text-xs px-3 py-1 rounded-lg border transition-colors shrink-0"
              :class="copyFeedback === item.account.id
                ? 'border-emerald-500 text-emerald-400 bg-emerald-900/20'
                : 'border-amber-400/40 text-amber-400 hover:border-amber-400 hover:bg-amber-400/10'"
            >
              {{ copyFeedback === item.account.id ? '✓ Copied!' : '📋 Copy progress' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Load more -->
    <div v-if="filtered.length > visibleCount" class="mt-4 text-center">
      <button
        @click="visibleCount += 50"
        class="text-sm text-amber-400 hover:text-amber-300 border border-amber-400/30 hover:border-amber-400
               px-4 py-2 rounded-lg transition-colors"
      >
        Show more ({{ filtered.length - visibleCount }} remaining)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { EnrichedAchievement } from '../composables/useAchievements'
import type { AchievementCategory, AchievementBit } from '../types/gw2'

const props = defineProps<{
  achievements: EnrichedAchievement[]
  categories: AchievementCategory[]
  sortedGroups: { id: string; name: string; order: number; categories: number[] }[]
  categoryToGroup: Map<number, string>
  presetCategory?: number | ''
  presetSearch?: string
  presetStatus?: 'all' | 'incomplete' | 'done' | 'inprogress' | 'notstarted'
  presetGroup?: string
  bitNamesCache: Map<string, string>
  resolveBitNames: (bits: AchievementBit[]) => Promise<void>
}>()

const search = ref(props.presetSearch ?? '')
const selectedCategory = ref<number | ''>(props.presetCategory ?? '')
const groupFilter = ref(props.presetGroup ?? '')
const statusFilter = ref<'all' | 'incomplete' | 'done' | 'inprogress' | 'notstarted'>(props.presetStatus ?? 'incomplete')
const typeFilter = ref<'all' | 'collections' | 'titles' | 'repeatable'>('all')
const sortBy = ref<'progress' | 'ap-remaining' | 'name'>('progress')
const visibleCount = ref(50)
const expanded = ref(new Set<number>())
const copyFeedback = ref<number | null>(null)

watch(() => props.presetCategory, (val) => { if (val !== undefined) selectedCategory.value = val })
watch(() => props.presetSearch, (val) => { if (val !== undefined) search.value = val })
watch(() => props.presetStatus, (val) => { if (val !== undefined) statusFilter.value = val })
watch(() => props.presetGroup, (val) => { if (val !== undefined) groupFilter.value = val ?? '' })

const sortedCategories = computed(() =>
  [...props.categories].sort((a, b) => a.name.localeCompare(b.name))
)

const isFiltered = computed(() =>
  search.value !== '' ||
  selectedCategory.value !== '' ||
  groupFilter.value !== '' ||
  statusFilter.value !== 'incomplete' ||
  typeFilter.value !== 'all'
)

function clearFilters() {
  search.value = ''
  selectedCategory.value = ''
  groupFilter.value = ''
  statusFilter.value = 'incomplete'
  typeFilter.value = 'all'
}

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  let results = props.achievements.filter(a => {
    if (q && !a.detail.name.toLowerCase().includes(q)) return false
    if (groupFilter.value && (a.category == null || props.categoryToGroup.get(a.category.id) !== groupFilter.value)) return false
    if (selectedCategory.value !== '' && a.category?.id !== selectedCategory.value) return false
    if (statusFilter.value === 'done' && !a.account.done) return false
    if (statusFilter.value === 'incomplete' && a.account.done) return false
    if (statusFilter.value === 'inprogress' && (a.account.done || (a.account.current ?? 0) === 0)) return false
    if (statusFilter.value === 'notstarted' && (a.account.done || (a.account.current ?? 0) > 0)) return false
    if (typeFilter.value === 'collections' && !a.detail.bits?.some(b => b.type === 'Item' || b.type === 'Skin' || b.type === 'Minipet')) return false
    if (typeFilter.value === 'titles' && !a.detail.rewards?.some(r => r.type === 'Title')) return false
    if (typeFilter.value === 'repeatable' && !a.detail.flags?.includes('Repeatable') && !(a.account.repeated && a.account.repeated > 0)) return false
    return true
  })

  if (sortBy.value === 'ap-remaining') {
    results = [...results].sort((a, b) => (b.totalPoints - b.earnedPoints) - (a.totalPoints - a.earnedPoints))
  } else if (sortBy.value === 'name') {
    results = [...results].sort((a, b) => a.detail.name.localeCompare(b.detail.name))
  } else {
    results = [...results].sort((a, b) => b.progressPercent - a.progressPercent)
  }

  return results
})

const visible = computed(() => filtered.value.slice(0, visibleCount.value))

function wikiUrl(name: string): string {
  return `https://wiki.guildwars2.com/wiki/${encodeURIComponent(name.replace(/ /g, '_'))}`
}

function isDisplayableBit(bit: AchievementBit): boolean {
  if (bit.type === 'Text') return !!bit.text?.trim()
  return bit.id != null
}

function remainingBitsFor(item: EnrichedAchievement): AchievementBit[] {
  if (!item.detail.bits) return []
  const doneBitIndices = new Set(item.account.bits ?? [])
  return item.detail.bits.filter((bit, idx) => !doneBitIndices.has(idx) && isDisplayableBit(bit))
}

function doneBitsFor(item: EnrichedAchievement): AchievementBit[] {
  if (!item.detail.bits) return []
  const doneBitIndices = new Set(item.account.bits ?? [])
  return item.detail.bits.filter((bit, idx) => doneBitIndices.has(idx) && isDisplayableBit(bit))
}

function displayableBitCount(item: EnrichedAchievement): number {
  return item.detail.bits?.filter(isDisplayableBit).length ?? 0
}

function getBitName(bit: AchievementBit): string {
  if (bit.type === 'Text') return bit.text!.trim()
  if (bit.id != null) {
    const cacheKey = `${bit.type.toLowerCase()}:${bit.id}`
    return props.bitNamesCache.get(cacheKey) ?? `${bit.type} #${bit.id}`
  }
  return 'Unknown task'
}

async function toggleExpand(item: EnrichedAchievement) {
  const id = item.account.id
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
    if (item.detail.bits?.some(b => b.type !== 'Text' && b.id != null)) {
      props.resolveBitNames(item.detail.bits!)
    }
  }
  expanded.value = new Set(expanded.value)
}

async function copyRemaining(item: EnrichedAchievement) {
  let text = ''
  if (item.detail.bits?.length && !item.account.done) {
    const remaining = remainingBitsFor(item)
    if (remaining.length === 0) return
    text = `${item.detail.name} — ${remaining.length} remaining:\n`
    text += remaining.map(b => `- ${getBitName(b)}`).join('\n')
  } else if (item.account.current != null && item.account.max != null) {
    const left = item.account.max - item.account.current
    text = `${item.detail.name} — ${item.account.current.toLocaleString()}/${item.account.max.toLocaleString()} (${item.progressPercent}% done), ${left.toLocaleString()} remaining`
  }
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    copyFeedback.value = item.account.id
    setTimeout(() => { copyFeedback.value = null }, 2000)
  } catch {
    // Clipboard not available
  }
}
</script>
